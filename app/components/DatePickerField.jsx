"use client";

import { formatarDataCurta } from "@/lib/formatters";
import styles from "./DatePickerField.module.css";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function formatarMes(valor) {
  const [ano, mes] = String(valor || "").split("-");
  return ano && MESES[Number(mes) - 1] ? `${MESES[Number(mes) - 1]}.${ano}` : "";
}

export default function DatePickerField({ type = "date", value = "", className = "", style, onChange, ...props }) {
  const texto = type === "month" ? formatarMes(value) : formatarDataCurta(value);
  return (
    <span className={`${styles.field} ${className}`} style={style}>
      <span className={`${styles.display} ${texto ? "" : styles.empty}`} aria-hidden="true">
        {texto || (type === "month" ? "Selecionar mês" : "Selecionar data")}
      </span>
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18" />
      </svg>
      <input className={styles.nativeInput} type={type} value={value} onChange={onChange} onInput={onChange} onClick={(event) => event.currentTarget.showPicker?.()} {...props} />
    </span>
  );
}
