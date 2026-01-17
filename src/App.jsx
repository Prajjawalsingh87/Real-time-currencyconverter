import { useState } from 'react'
import { InputBox } from './components'
import useCurrencyInfo from './hooks/UseCurrencyInfo'

function App() {

  const [amount, setAmount] = useState(0)
  const [from, setFrom] = useState("usd")
  const [to, setTo] = useState("inr")
  const [convertedAmount, setConvertedAmount] = useState(0)

  const currencyInfo = useCurrencyInfo(from)
  const options = Object.keys(currencyInfo)

  const swap = () => {
    setFrom(to)
    setTo(from)
    setConvertedAmount(amount)
    setAmount(convertedAmount)
  }

  const convert = () => {
    setConvertedAmount(amount * currencyInfo[to])
  }

  return (
    <div
      className="w-full h-screen flex justify-center items-center bg-cover bg-no-repeat bg-slate-700"
      style={{
        backgroundImage: `url('https://images.pexels.com/photos/3532540/pexels-photo-3532540.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')`,
      }}
    >
        
      <div className="w-full px-4">
        <div className="w-full max-w-4xl mx-auto border border-gray-200 rounded-2xl p-10 backdrop-blur-md bg-teal-500/30 shadow-2xl">
          
          <form
            onSubmit={(e) => {
              e.preventDefault()
              convert()
            }}
          >
            <div className="w-full mb-4">
              <InputBox
                label="From"
                amount={amount}
                currencyOptions={options}
                onCurrencyChange={(currency) => setFrom(currency)}
                selectCurrency={from}
                onAmountChange={(amount) => setAmount(amount)}
              />
            </div>

            <div className="relative w-full h-1 my-6">
              <button
                type="button"
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-lg bg-red-700 text-white px-4 py-2 text-lg font-semibold shadow-lg hover:bg-red-800 transition"
                onClick={swap}
              >
                SWAP
              </button>
            </div>

            <div className="w-full mt-4 mb-6">
              <InputBox
                label="To"
                amount={convertedAmount}
                currencyOptions={options}
                onCurrencyChange={(currency) => setTo(currency)}
                selectCurrency={to}
                amountDisable
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-700 text-white px-6 py-4 text-lg rounded-xl font-semibold shadow-lg hover:bg-red-800 transition"
            >
              Convert {from.toUpperCase()} to {to.toUpperCase()}
            </button>

          </form>

        </div>
      </div>
    </div>
  )
}

export default App
