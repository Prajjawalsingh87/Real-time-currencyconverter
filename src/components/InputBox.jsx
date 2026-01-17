import React, { useId } from 'react'

function InputBox({
  label,
  amount,
  onAmountChange,
  onCurrencyChange,
  currencyOptions = [],
  selectCurrency = "usd",
  amountDisable = false,
  currencyDisable = false,
  className = "",
}) {
  const amountInputId = useId()

  return (
    <div className={`bg-white p-5 rounded-xl text-base flex items-center gap-4 ${className}`}>
      
      {/* Amount Section */}
      <div className="w-2/3">
        <label htmlFor={amountInputId} className="text-black/50 mb-2 block font-medium">
          {label}
        </label>
        <input
          id={amountInputId}
          className="outline-none w-full bg-transparent py-2 text-lg border-b border-gray-300 focus:border-teal-500 transition"
          type="number"
          placeholder="Amount"
          disabled={amountDisable}
          value={amount}
          onChange={(e) => onAmountChange && onAmountChange(Number(e.target.value))}
        />
      </div>

      {/* Currency Section */}
      <div className="w-1/3 text-right">
        <p className="text-black/50 mb-2 font-medium">Currency Type</p>
        <select
          className="rounded-lg px-4 py-2 bg-gray-100 cursor-pointer outline-none text-lg w-full border border-gray-300 focus:ring-2 focus:ring-teal-500"
          value={selectCurrency}
          onChange={(e) => onCurrencyChange && onCurrencyChange(e.target.value)}
          disabled={currencyDisable}
        >
          {currencyOptions.map((currency) => (
            <option key={currency} value={currency}>
              {currency.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

    </div>
  )
}

export default InputBox
