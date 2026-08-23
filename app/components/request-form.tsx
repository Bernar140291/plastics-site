"use client";

import { CheckCircle2, Copy, FileUp, Mail, RotateCcw, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { materials } from "../data/materials";

type PreparedRequest = { mailto: string; text: string };

export function RequestForm() {
  const [prepared, setPrepared] = useState<PreparedRequest | null>(null);
  const [material, setMaterial] = useState("");
  const [grade, setGrade] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMaterial(params.get("material") || "");
    setGrade(params.get("grade") || "");
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      "",
      "Примечание: если выбран файл, его нужно приложить к письму вручную.",
    ];
    const text = lines.join("\n");
    const subject = `Запрос ExaPolymer: ${selected?.code || "подбор материала"}${grade ? ` ${grade}` : ""}`;
    setPrepared({ text, mailto: `mailto:info@exapolymer.ru?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}` });
  }

  async function copyRequest() {
    if (!prepared) return;
    try {
      await navigator.clipboard.writeText(prepared.text);
      setCopyStatus("Текст скопирован");
    } catch {
      setCopyStatus("Не удалось скопировать — выделите текст вручную");
    }
  }

  if (prepared) return (
    <div className="form-success" role="status">
      <CheckCircle2 size={30} />
      <h2>Запрос подготовлен</h2>
      <p>Сайт не сохраняет данные. Откройте письмо в своей почтовой программе или скопируйте готовый текст.</p>
      <pre>{prepared.text}</pre>
      <div className="prepared-actions">
        <a className="button button-primary" href={prepared.mailto}><Mail size={18} /> Открыть письмо</a>
        <button className="button button-outline-dark" type="button" onClick={copyRequest}><Copy size={18} /> Скопировать</button>
        <button className="reset-button" type="button" onClick={() => { setPrepared(null); setCopyStatus(""); }}><RotateCcw size={16} /> Изменить</button>
      </div>
      {copyStatus && <p className="copy-status">{copyStatus}</p>}
    </div>
  );

  return (
    <form className="request-form" onSubmit={submit}>
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
      <label className="file-field"><span><FileUp size={18} /> Чертёж или техническое задание</span><input name="file" type="file" accept=".pdf,.dwg,.dxf,.step,.stp,.jpg,.jpeg,.png" /><small>Файл остаётся на устройстве. После открытия письма приложите его вручную.</small></label>
      <label className="consent-field"><input type="checkbox" required /><span>Согласен подготовить письмо с указанными данными. Сайт не передаёт и не сохраняет информацию.</span></label>
      <button className="button button-primary form-submit" type="submit"><Send size={18} /> Подготовить запрос</button>
    </form>
  );
}
