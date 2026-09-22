"use client";

import { AlertTriangle, CheckCircle2, Copy, FileUp, Mail, RotateCcw, Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { materials } from "../data/materials";

/* Тот же рабочий эндпоинт, что и на exapolymer.ru — ключ web3forms публичный по устройству сервиса. */
const ENDPOINT = "https://api.web3forms.com/submit";
const ACCESS_KEY = "aef11f7d-2862-4ff1-8086-336d73e0efc3";

type Status = "idle" | "prepared" | "sending" | "sent" | "error";

export function RequestForm({ deliveryEnabled = false, privacyVersion }: { deliveryEnabled?: boolean; privacyVersion: string }) {
  /* Материал и марка приходят ссылкой с карточки: /contacts?material=peek&grade=K12N%2FB.
     Читаем их сразу в начальное состояние — эффект, дописывающий состояние
     после первого рендера, давал лишний каскад рендеров. */
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("idle");
  const [material, setMaterial] = useState(() => materials.some((item) => item.slug === searchParams.get("material")) ? searchParams.get("material")! : "");
  const [grade, setGrade] = useState(() => searchParams.get("grade") || "");
  const [fallbackText, setFallbackText] = useState("");
  const [mailto, setMailto] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const sending = useRef(false);
  const resultPanel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "prepared" || status === "error") resultPanel.current?.focus();
  }, [status, fallbackText]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const form = new FormData(event.currentTarget);
    const selected = materials.find((item) => item.slug === material);
    const materialLabel = selected ? `${selected.code} — ${selected.name}` : "Нужен подбор";

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
    ];
    const text = lines.join("\n");
    const subject = `Запрос ExaPolymer: ${selected?.code || "подбор материала"}${grade ? ` ${grade}` : ""}`;
    setFallbackText(text);
    setMailto(`mailto:info@exapolymer.ru?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`);

    if (!deliveryEnabled) {
      setStatus("prepared");
      setCopyStatus("");
      return;
    }

    form.set("access_key", ACCESS_KEY);
    form.set("subject", subject);
    form.set("material", materialLabel);
    form.set("from_name", "Сайт ExaPolymer");
    form.set("consent_version", privacyVersion);
    form.set("consent_at", new Date().toISOString());

    sending.current = true;
    setStatus("sending");
    setCopyStatus("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        body: form,
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      /* web3forms отвечает 200 и на отказ (спам-фильтр, honeypot, исчерпанная квота),
         признак доставки — только поле success в теле. */
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok || typeof result !== "object" || result === null || !("success" in result) || result.success !== true) {
        throw new Error("Сервис не подтвердил отправку");
      }
      setStatus("sent");
    } catch {
      setStatus("error");
    } finally {
      window.clearTimeout(timeout);
      sending.current = false;
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
      <p className="file-reminder"><FileUp size={17} /> Если есть чертёж, приложите его к <a href={mailto}>письму с данными заявки</a>.</p>
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
      {status === "prepared" && (
        <div className="form-prepared" role="status" ref={resultPanel} tabIndex={-1}>
          <h2>Текст заявки готов</h2>
          <p>Заявка ещё не отправлена. Откройте письмо и отправьте его из своей почты или скопируйте текст. Чертёж можно приложить к письму.</p>
          <textarea aria-label="Подготовленный текст заявки" readOnly rows={10} value={fallbackText} />
          <div className="prepared-actions"><a className="button button-primary" href={mailto}><Mail size={18} /> Открыть письмо</a><button className="button button-outline-dark" type="button" onClick={copyRequest}><Copy size={18} /> Скопировать текст</button></div>
          {copyStatus && <p>{copyStatus}</p>}
        </div>
      )}
      {status === "error" && (
        <div className="send-error" role="alert" ref={resultPanel} tabIndex={-1}>
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

      <form className="request-form" onSubmit={submit} onChange={() => {
        if (status === "prepared") {
          setStatus("idle");
          setFallbackText("");
          setMailto("");
          setCopyStatus("");
        }
      }}>
        {!deliveryEnabled && <p className="form-mode-note">Составьте заявку здесь и отправьте её письмом. Введённые данные остаются в этой вкладке до отправки из вашей почты.</p>}
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
          <label><span>Материал</span><select name="material" value={material} onChange={(event) => { setMaterial(event.target.value); setGrade(""); }}><option value="">Нужен подбор</option>{materials.map((item) => <option key={item.slug} value={item.slug}>{item.code} — {item.name}</option>)}</select></label>
          <label><span>Марка / артикул</span><input name="grade" value={grade} onChange={(event) => setGrade(event.target.value)} placeholder="Например, K12N/B" /></label>
        </div>
        <label><span>Условия работы и размеры *</span><textarea name="task" rows={7} required placeholder="Температура, химическая среда, нагрузка, размеры, количество и желаемый срок" /></label>
        <div className="attachment-note"><FileUp size={20} /><p>Есть чертёж или техническое задание? Отправьте файл на <a href="mailto:info@exapolymer.ru?subject=Чертёж%20для%20расчёта%20ExaPolymer">info@exapolymer.ru</a>. В форме можно описать размеры и требования.</p></div>
        <label className="consent-field"><input type="checkbox" name="consent" value="yes" required /><span>Даю <a href="/consent" target="_blank" rel="noopener">согласие на обработку персональных данных</a> для ответа на заявку. Ознакомлен с <a href="/privacy" target="_blank" rel="noopener">политикой обработки данных</a>.</span></label>
        <button className="button button-primary form-submit" type="submit" disabled={status === "sending"}>
          <Send size={18} /> {status === "sending" ? "Отправляем…" : deliveryEnabled ? "Отправить заявку" : "Подготовить заявку"}
        </button>
      </form>
    </div>
  );
}
