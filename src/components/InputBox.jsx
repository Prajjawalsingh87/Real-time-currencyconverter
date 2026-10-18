import { useId } from 'react'
import CurrencySelect from './CurrencySelect'

function InputBox({
  label,
  amount,
  onAmountChange,
  onCurrencyChange,
  currencyOptions = [],
  currencyNames = {},
  selectCurrency = "usd",
  amountDisable = false,
  loading = false,
  className = "",
}) {
  const amountInputId = useId()

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition focus-within:border-indigo-400/50 focus-within:bg-white/[0.06] ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <label htmlFor={amountInputId} className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </label>
        <span className="truncate pl-3 text-xs text-slate-500">{currencyNames[selectCurrency] || ""}</span>
      </div>

      <div className="flex items-center gap-4">
        {loading ? (
          <div className="h-10 flex-1 animate-pulse rounded-lg bg-white/10" />
        ) : (
          <input
            id={amountInputId}
            className="min-w-0 flex-1 bg-transparent text-3xl font-semibold tracking-tight text-white outline-none placeholder-slate-600 disabled:cursor-default sm:text-4xl"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            readOnly={amountDisable}
            value={amount}
            onChange={(e) => {
              const v = e.target.value.replace(/,/g, "")
              if (/^\d*\.?\d*$/.test(v)) onAmountChange?.(v)
            }}
          />
        )}
        <CurrencySelect
          label={`${label} currency`}
          value={selectCurrency}
          onChange={onCurrencyChange}
          options={currencyOptions}
          names={currencyNames}
        />
      </div>
    </div>
  )
}

export default InputBox
