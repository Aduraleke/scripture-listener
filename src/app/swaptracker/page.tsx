'use client'

import React, { useState, useEffect } from 'react'
import { Download, Plus, Trash2, Filter } from 'lucide-react'

// --- Types ---
interface SwapEntry {
  id: number
  date: string
  broker: string
  symbol: string
  swapLong: number
  swapShort: number
}

// --- Component ---
const BrokerSwapTracker: React.FC = () => {
  const symbols: string[] = [
    'CADCHF',
    'AUDNZD',
    'XAUUSD',
    'EURCHF',
    'AUDCAD',
    'NZDCAD',
    'GBPUSD',
    'EURUSD',
    'NZDUSD',
    'AUDUSD',
    'XAGUSD',
    'NAS',
    'USDZAR',
  ]

  const brokers: string[] = [
    'Amana',
    'Scope',
    'Infinox',
    'Bidv',
    'Velocity',
    'SQ',
    'AM',
    'IG',
    'FXCM',
    'Invast',
    'Finalto',
    'Taurex',
  ]

  const [entries, setEntries] = useState<SwapEntry[]>([])
  const [filterBroker, setFilterBroker] = useState<string>('')
  const [filterSymbol, setFilterSymbol] = useState<string>('')
  const [filterDate, setFilterDate] = useState<string>('')
  const [showFilters, setShowFilters] = useState<boolean>(false)

  // --- Load Data ---
  useEffect(() => {
    const loadData = () => {
      try {
        const saved = localStorage.getItem('swap-entries')
        if (saved) setEntries(JSON.parse(saved))
      } catch  {
        console.log('No existing data found')
      }
    }
    loadData()
  }, [])

  // --- Save Data ---
  const saveData = (data: SwapEntry[]) => {
    try {
      localStorage.setItem('swap-entries', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save data:', error)
      alert('Failed to save data. Please try again.')
    }
  }

  // --- CRUD Operations ---
  const addEntry = () => {
    const newEntry: SwapEntry = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      broker: brokers[0],
      symbol: symbols[0],
      swapLong: 0,
      swapShort: 0,
    }
    const updated = [...entries, newEntry]
    setEntries(updated)
    saveData(updated)
  }

  const updateEntry = (id: number, field: keyof SwapEntry, value: string | number) => {
    const updated = entries.map(entry =>
      entry.id === id ? { ...entry, [field]: value } : entry
    )
    setEntries(updated)
    saveData(updated)
  }

  const deleteEntry = (id: number) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      const updated = entries.filter(entry => entry.id !== id)
      setEntries(updated)
      saveData(updated)
    }
  }

  // --- Filter + Export ---
  const filteredEntries = entries.filter(entry => {
    if (filterBroker && entry.broker !== filterBroker) return false
    if (filterSymbol && entry.symbol !== filterSymbol) return false
    if (filterDate && entry.date !== filterDate) return false
    return true
  })

  const exportToCSV = () => {
    const headers = ['Date', 'Broker', 'Symbol', 'Swap Long', 'Swap Short']
    const rows = filteredEntries.map(e => [
      e.date,
      e.broker,
      e.symbol,
      e.swapLong,
      e.swapShort,
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `swap-charges-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // --- Totals ---
  const getTotals = () => {
    return filteredEntries.reduce(
      (acc, entry) => {
        acc.long += entry.swapLong || 0
        acc.short += entry.swapShort || 0
        return acc
      },
      { long: 0, short: 0 }
    )
  }

  const totals = getTotals()

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800 rounded-xl shadow-2xl p-6 mb-6 border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Broker Swap Charges Tracker
              </h1>
              <p className="text-slate-400">
                Daily monitoring of swap charges across brokers
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button
                onClick={addEntry}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-900 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Filter by Broker
                </label>
                <select
                  value={filterBroker}
                  onChange={e => setFilterBroker(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Brokers</option>
                  {brokers.map(broker => (
                    <option key={broker} value={broker}>
                      {broker}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Filter by Symbol
                </label>
                <select
                  value={filterSymbol}
                  onChange={e => setFilterSymbol(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Symbols</option>
                  {symbols.map(symbol => (
                    <option key={symbol} value={symbol}>
                      {symbol}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Filter by Date
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="bg-slate-900 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-slate-400 text-sm">Total Entries</p>
                <p className="text-2xl font-bold text-white">
                  {filteredEntries.length}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Swap Long</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {totals.long.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Swap Short</p>
                <p className="text-2xl font-bold text-red-400">
                  {totals.short.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900">
                <tr>
                  {['Date', 'Broker', 'Symbol', 'Swap Long', 'Swap Short', 'Actions'].map(
                    head => (
                      <th
                        key={head}
                        className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
                      >
                        {head}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-slate-400"
                    >
                      No entries yet. Click &apos;Add Entry&apos; to start tracking swap
                      charges.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map(entry => (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-700 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="date"
                          value={entry.date}
                          onChange={e =>
                            updateEntry(entry.id, 'date', e.target.value)
                          }
                          className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={entry.broker}
                          onChange={e =>
                            updateEntry(entry.id, 'broker', e.target.value)
                          }
                          className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {brokers.map(broker => (
                            <option key={broker} value={broker}>
                              {broker}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={entry.symbol}
                          onChange={e =>
                            updateEntry(entry.id, 'symbol', e.target.value)
                          }
                          className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {symbols.map(symbol => (
                            <option key={symbol} value={symbol}>
                              {symbol}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          value={entry.swapLong}
                          onChange={e =>
                            updateEntry(
                              entry.id,
                              'swapLong',
                              parseFloat(e.target.value)
                            )
                          }
                          className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          value={entry.swapShort}
                          onChange={e =>
                            updateEntry(
                              entry.id,
                              'swapShort',
                              parseFloat(e.target.value)
                            )
                          }
                          className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BrokerSwapTracker
