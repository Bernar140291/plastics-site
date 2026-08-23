"use client";

import { AlertTriangle, CheckCircle2, Copy, FileUp, Mail, RotateCcw, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { materials } from "../data/materials";

/* Тот же рабочий эндпоинт, что и на exapolymer.ru — ключ web3forms публичный по устройству сервиса. */
const ENDPOINT = "https://api.web3forms.com/submit";
const ACCESS_KEY = "aef11f7d-2862-4ff1-8086-336d73e0efc3";

type Status = "idle" | "sending" | "sent" | "error";

export function RequestForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [material, setMaterial] = useState("");
  const [grade, setGrade] = useState("");
  const [fallbackText, setFallbackText] = useState("");
  const [mailto, setMailto] = useState("");
  const [hadFile, setHadFile] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMaterial(params.get("material") || "");
    setGrade(params.get("grade") || "");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const selected = materials.find((item) => item.slug === material);
    const materialLabel = selected ? `${selected.code} — ${selected.name}` : "Нужен подбор";

    /* Вложение через web3forms не уходит, поэтому файл из отправки убираем,
       но упоминаем и в письме-фолбэке, и в экране успеха. */
    const file = form.get("file");
    const withFile = file instanceof File && file.size > 0;
    setHadFile(withFile);
    form.delete("file");

    const lines = [
      "Запрос на подбор и расчёт поставки ExaPolymer",
      "",
      `Имя: ${form.get("name") || "—"}`,
      `Компания: ${form.get("company") || "—"}`,
      `Email: ${form.get("email") || "—"}`,
      `Телефон: ${form.get("phone") || "—"}`,
      `Материал: ${materialLabel}`,
      `Марка / артикул: ${grade || "не указан"}`,
      "",
      "Условия работы, размеры и количество:",
      String(form.get("task") || "—"),
      ...(withFile ? ["", "Примечание: чертёж нужно приложить к письму вручную."] : []),
    ];
    const text = lines.join("\n");
    const subject = `Запрос ExaPolymer: ${selected?.code || "подбор материала"}${grade ? ` ${grade}` : ""}`;
    setFallbackText(text);
    setMailto(`mailto:info@exapolymer.ru?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`);

    form.set("access_key", ACCESS_KEY);
    form.set("subject", subject);
    form.set("material", materialLabel);
    form.set("from_name", "Сайт ExaPolymer");

    setStatus("sending");
    setCopyStatus("");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        body: form,
        headers: { Accept: "application/json" },
      });
      /* web3forms отвечает 200 и на отказ (спам-фильтр, honeypot, исчерпанная квота),
         признак доставки — только поле success в теле. */
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.message || `HTTP ${response.status}`);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  async function copyRequest() {
    try {
      await navigator.clipboard.writeText(fallbackText);
      setCopyStatus("Текст скопирован");
    } catch {
      setCopyStatus("Не удалось скопировать — выделите текст вручную");
    }
  }

  if (status === "sent") return (
    <div className="form-success" role="status">
      <CheckCircle2 size={30} />
      <h2>Заявка отправлена</h2>
      <p>Ответим на указанную почту. До оформления заказа подтвердим марку, наличие, срок и комплект документов по партии.</p>
      {hadFile && (
        <p className="file-reminder">
          <FileUp size={17} /> Чертёж через форму не уходит — пришлите его письмом на <a href="mailto:info@exapolymer.ru">info@exapolymer.ru</a>.
        </p>
      )}
      <div className="prepared-actions">
        <button className="reset-button" type="button" onClick={() => { setStatus("idle"); setCopyStatus(""); }}>
          <RotateCcw size={16} /> Отправить ещё одну
        </button>
      </div>
    </div>
  );

  /* Форма при ошибке остаётся смонтированной: поля неуправляемые, и подмена
     поддерева стёрла бы уже введённое техзадание. */
  return (
    <div className="request-form-wrap">
      {status === "error" && (
        <div className="send-error" role="alert">
          <AlertTriangle size={24} />
          <div>
            <h3>Не удалось отправить</h3>
            <p>Сервис отправки не ответил. Введённое сохранено — попробуйте ещё раз или отправьте письмом, ответим так же.</p>
            <details><summary>Текст заявки</summary><pre>{fallbackText}</pre></details>
            <div className="prepared-actions">
              <a className="button button-primary" href={mailto}><Mail size={18} /> Открыть письмо</a>
              <button className="button button-outline-dark" type="button" onClick={copyRequest}><Copy size={18} /> Скопировать</button>
            </div>
            {copyStatus && <p className="copy-status">{copyStatus}</p>}
          </div>
        </div>
      )}

      <form className="request-form" onSubmit={submit}>
        <input type="checkbox" name="botcheck" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
        <div className="form-row">
          <label><span>Имя *</span><input name="name" autoComplete="name" required /></label>
          <label><span>Компания / ИП</span><input name="company" autoComplete="organization" /></label>
        </div>
        <div className="form-row">
          <label><span>Email *</span><input name="email" type="email" autoComplete="email" required /></label>
          <label><span>Телефон</span><input name="phone" type="tel" autoComplete="tel" /></label>
        </div>
        <div className="form-row">
          <label><span>Материал</span><select name="material" value={material} onChange={(event) => setMaterial(event.target.value)}><option value="">Нужен подбор</option>{materials.map((item) => <option key={item.slug} value={item.slug}>{item.code} — {item.name}</option>)}</select></label>
          <label><span>Марка / артикул</span><input name="grade" value={grade} onChange={(event) => setGrade(event.target.value)} placeholder="Например, K12N/B" /></label>
        </div>
        <label><span>Условия работы и размеры *</span><textarea name="task" rows={7} required placeholder="Температура, химическая среда, нагрузка, размеры, количество и желаемый срок" /></label>
        <label className="file-field"><span><FileUp size={18} /> Чертёж или техническое задание</span><input name="file" type="file" accept=".pdf,.dwg,.dxf,.step,.stp,.jpg,.jpeg,.png" /><small>Файл остаётся на устройстве: после отправки пришлите его письмом на info@exapolymer.ru.</small></label>
        <label className="consent-field"><input type="checkbox" required /><span>Согласен, чтобы указанные данные ушли на почту компании через сервис отправки форм и были использованы для ответа на заявку.</span></label>
        <button className="button button-primary form-submit" type="submit" disabled={status === "sending"}>
          <Send size={18} /> {status === "sending" ? "Отправляем…" : "Отправить заявку"}
        </button>
      </form>
    </div>
  );
}
