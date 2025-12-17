import React, { useState, useEffect, useRef } from 'react'
import { 
  Chart, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  BarController,
  LineElement, 
  LineController,
  PointElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js'
import Papa from 'papaparse'
import { Upload, Download, BarChart3, TrendingUp, Table, Grid } from 'lucide-react'

// Register Chart.js components (controllers are required for chart types)
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend
)

const METRIC_COLORS = [
  "rgba(79, 70, 229, 0.95)", // indigo
  "rgba(6, 148, 162, 0.95)", // teal
  "rgba(37, 99, 235, 0.95)", // blue
  "rgba(217, 119, 6, 0.95)", // amber
  "rgba(185, 28, 28, 0.95)", // red
  "rgba(190, 24, 93, 0.95)", // pink
  "rgba(4, 120, 87, 0.95)", // emerald
  "rgba(180, 83, 9, 0.95)", // orange
]

function normalizeHeaderName(name) {
  if (!name && name !== 0) return ""
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[\s_\-]+/g, "")
}

function normalizeDateString(raw) {
  if (!raw) return ""
  const trimmed = String(raw).trim()
  if (!trimmed) return ""
  const d = new Date(trimmed)
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }
  return trimmed
}

// Separate component for thumbnail charts to manage refs properly
function ThumbnailChart({ metric, labels, data, thumbnailChartsRef, index }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (canvasRef.current) {
      // Destroy existing chart if any
      if (chartRef.current) {
        chartRef.current.destroy()
      }
      
      const chart = new Chart(canvasRef.current, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: metric.color,
            borderRadius: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: true } },
          scales: {
            x: { display: false },
            y: { display: false, beginAtZero: true },
          },
        },
      })
      
      chartRef.current = chart
      
      // Store in parent ref array
      if (thumbnailChartsRef.current[index]) {
        thumbnailChartsRef.current[index].destroy()
      }
      thumbnailChartsRef.current[index] = chart
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [labels, data, metric, index])

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 truncate">
        {metric.label}
      </div>
      <div className="h-20">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

export default function CSVMetrics() {
  const [parsedRows, setParsedRows] = useState([])
  const [metricsConfig, setMetricsConfig] = useState([])
  const [activeDateKeys, setActiveDateKeys] = useState(new Set())
  const [activeMetricIds, setActiveMetricIds] = useState(new Set())
  const [currentChartType, setCurrentChartType] = useState('bar') // 'bar', 'line', 'table', 'thumbnails'
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState({ message: '', isError: false })
  const [collapsedSections, setCollapsedSections] = useState({ metrics: false, timePeriods: false })
  
  const chartRef = useRef(null)
  const chartInstanceRef = useRef(null)
  const thumbnailChartsRef = useRef([])

  useEffect(() => {
    const hasData = parsedRows.length > 0 && activeDateKeys.size > 0 && activeMetricIds.size > 0
    
    try {
      if (currentChartType === 'bar' || currentChartType === 'line') {
        if (hasData) {
          // Destroy existing chart if type changed
          if (chartInstanceRef.current && chartInstanceRef.current.config.type !== currentChartType) {
            chartInstanceRef.current.destroy()
            chartInstanceRef.current = null
          }
          createOrUpdateChart()
        } else {
          // Destroy chart when no data
          if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy()
            chartInstanceRef.current = null
          }
        }
      } else if (currentChartType === 'table') {
        // Table is rendered in JSX
      } else if (currentChartType === 'thumbnails') {
        // Thumbnails are rendered in JSX with refs
      }
    } catch (error) {
      console.error('Error updating chart:', error)
      setStatus({ message: `Chart error: ${error.message}`, isError: true })
    }
  }, [parsedRows, activeDateKeys, activeMetricIds, currentChartType])

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      try {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy()
        }
        thumbnailChartsRef.current.forEach((chart) => {
          if (chart && typeof chart.destroy === 'function') {
            chart.destroy()
          }
        })
      } catch (error) {
        console.error('Error cleaning up charts:', error)
      }
    }
  }, [])

  const createOrUpdateChart = () => {
    const ctx = chartRef.current
    if (!ctx) return

    const filteredRows = parsedRows.filter((row) => activeDateKeys.has(row.DateKey))
    const labels = filteredRows.map((row) => row.DateDisplay)

    const datasets = metricsConfig
      .filter((m) => activeMetricIds.has(m.id))
      .map((metric) => ({
        label: metric.label,
        data: filteredRows.map((row) => {
          const raw = row[metric.field]
          if (typeof raw === "string") {
            const cleaned = raw.replace(/,/g, "")
            const num = parseFloat(cleaned)
            return Number.isFinite(num) ? num : 0
          }
          const num = typeof raw === "number" && Number.isFinite(raw) ? raw : parseFloat(raw || "0")
          return Number.isFinite(num) ? num : 0
        }),
        backgroundColor: metric.color,
        borderColor: metric.color,
        borderWidth: 1,
        borderRadius: 3,
        maxBarThickness: 32,
      }))

    if (chartInstanceRef.current && chartInstanceRef.current.config.type === currentChartType) {
      chartInstanceRef.current.data.labels = labels
      chartInstanceRef.current.data.datasets = datasets
      chartInstanceRef.current.update()
    } else {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
      chartInstanceRef.current = new Chart(ctx, {
        type: currentChartType,
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: "index",
          },
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "#222222",
                font: { size: 11 },
                usePointStyle: true,
                padding: 12,
              },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const label = ctx.dataset.label || ""
                  const value = ctx.parsed.y
                  return `${label}: ${value.toLocaleString()}`
                },
              },
            },
          },
          scales: {
            x: {
              stacked: false,
              ticks: {
                color: "#222222",
                maxRotation: 45,
                minRotation: 0,
              },
              grid: { display: false },
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: "#222222",
                callback: (v) => v.toLocaleString(),
              },
              grid: { color: "#aaaaaa" },
            },
          },
        },
      })
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setStatus({ message: 'Parsing CSV…', isError: false })

    try {
      const text = await file.text()
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          try {
            const rows = results.data || []
            const fields = (results.meta && results.meta.fields) || []

            if (!rows.length) {
              setStatus({ message: 'No rows found in CSV', isError: true })
              setParsedRows([])
              setActiveDateKeys(new Set())
              setMetricsConfig([])
              return
            }

            // Normalize and enrich rows
            const normalizedRows = rows
              .map((row) => {
                try {
                  let rawDate = row.Date ?? row.date ?? row.DATE ?? row.date_local ?? undefined
                  if (!rawDate && fields && fields.length) {
                    const dateField = fields.find((f) => /date/i.test(String(f).trim()))
                    if (dateField && dateField in row) {
                      rawDate = row[dateField]
                    }
                  }
                  const normalized = normalizeDateString(rawDate)
                  if (!normalized) return null
                  return {
                    ...row,
                    DateKey: normalized,
                    DateDisplay: normalized,
                  }
                } catch (rowError) {
                  console.warn('Error processing row:', rowError, row)
                  return null
                }
              })
              .filter(Boolean)

            if (!normalizedRows.length) {
              setStatus({ message: 'No valid Date values found in CSV. Please ensure your CSV has a date column.', isError: true })
              setActiveDateKeys(new Set())
              setMetricsConfig([])
              return
            }

            // Build metrics config
            const newMetricsConfig = []
            if (fields && fields.length) {
              const dateFieldNames = new Set(
                fields.filter((f) => /date/i.test(String(f).trim()))
              )
              const numericSample = normalizedRows[0] || {}

              fields.forEach((fieldName, index) => {
                try {
                  if (!fieldName) return
                  if (dateFieldNames.has(fieldName)) return

                  const sampleValue = numericSample[fieldName]
                  const isNumericSample =
                    typeof sampleValue === "number" ||
                    (typeof sampleValue === "string" &&
                      sampleValue.trim() !== "" &&
                      !Number.isNaN(parseFloat(sampleValue.replace(/,/g, ""))))

                  if (!isNumericSample) return

                  const id = normalizeHeaderName(fieldName) || `metric_${index}`
                  const color = METRIC_COLORS[newMetricsConfig.length % METRIC_COLORS.length]

                  newMetricsConfig.push({
                    id,
                    label: String(fieldName).trim(),
                    field: fieldName,
                    color,
                  })
                } catch (fieldError) {
                  console.warn('Error processing field:', fieldName, fieldError)
                }
              })
            }

            if (newMetricsConfig.length === 0) {
              setStatus({ message: 'No numeric metrics found in CSV. Please ensure your CSV has numeric columns.', isError: true })
              setParsedRows([])
              setActiveDateKeys(new Set())
              setMetricsConfig([])
              return
            }

            // Initialize active sets
            const newActiveDateKeys = new Set(normalizedRows.map((r) => r.DateKey))
            const newActiveMetricIds = newMetricsConfig.length > 0 
              ? new Set([newMetricsConfig[0].id])
              : new Set()

            setParsedRows(normalizedRows)
            setMetricsConfig(newMetricsConfig)
            setActiveDateKeys(newActiveDateKeys)
            setActiveMetricIds(newActiveMetricIds)
            setStatus({ message: `✅ Successfully loaded ${normalizedRows.length} rows with ${newMetricsConfig.length} metrics`, isError: false })
          } catch (parseError) {
            console.error('Error processing CSV data:', parseError)
            setStatus({ message: `Error processing CSV: ${parseError.message}`, isError: true })
            setParsedRows([])
            setActiveDateKeys(new Set())
            setMetricsConfig([])
          }
        },
        error: (err) => {
          console.error('CSV parse error:', err)
          setStatus({ message: `Failed to parse CSV file: ${err.message || 'Invalid CSV format'}`, isError: true })
          setParsedRows([])
          setActiveDateKeys(new Set())
          setMetricsConfig([])
        },
      })
    } catch (err) {
      console.error('Error handling CSV file:', err)
      setStatus({ message: `Failed to read CSV file: ${err.message || 'Unknown error'}`, isError: true })
      setParsedRows([])
      setActiveDateKeys(new Set())
      setMetricsConfig([])
    }
  }

  const toggleDate = (dateKey) => {
    const newSet = new Set(activeDateKeys)
    if (newSet.has(dateKey)) {
      newSet.delete(dateKey)
    } else {
      newSet.add(dateKey)
    }
    setActiveDateKeys(newSet)
  }

  const toggleMetric = (metricId) => {
    const newSet = new Set(activeMetricIds)
    if (newSet.has(metricId)) {
      newSet.delete(metricId)
    } else {
      newSet.add(metricId)
    }
    setActiveMetricIds(newSet)
  }

  const selectAllDates = () => {
    setActiveDateKeys(new Set(parsedRows.map((r) => r.DateKey)))
  }

  const clearAllDates = () => {
    setActiveDateKeys(new Set())
  }

  const clearAllMetrics = () => {
    setActiveMetricIds(new Set())
  }

  const exportChart = () => {
    if (!chartInstanceRef.current) return

    const canvas = chartRef.current
    if (!canvas) return

    const exportCanvas = document.createElement("canvas")
    exportCanvas.width = canvas.width
    exportCanvas.height = canvas.height
    const ctx = exportCanvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
    ctx.drawImage(canvas, 0, 0)

    const dataUrl = exportCanvas.toDataURL("image/png")
    const link = document.createElement("a")
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
    link.href = dataUrl
    link.download = `community-metrics-${timestamp}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredRows = parsedRows.filter((row) => activeDateKeys.has(row.DateKey))
  const activeMetrics = metricsConfig.filter((m) => activeMetricIds.has(m.id))
  const hasData = parsedRows.length > 0 && activeDateKeys.size > 0 && activeMetricIds.size > 0

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Community Metrics Tool
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload a CSV of community metrics with any headers, then adjust the chart.
              </p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {fileName && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Current file: <strong className="text-gray-900 dark:text-white">{fileName}</strong>
                </div>
              )}
              {status.message && (
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  status.isError 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {status.message}
                </div>
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full cursor-pointer transition-colors font-medium text-sm">
                <Upload size={16} />
                {fileName ? 'Upload Different CSV' : 'Upload CSV'}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            {/* Message for Thumbnails view */}
            {parsedRows.length > 0 && currentChartType === 'thumbnails' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Selectors unavailable in Thumbnails view
                </p>
              </div>
            )}

            {/* Metrics Section */}
            {parsedRows.length > 0 && currentChartType !== 'thumbnails' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div 
                  className="flex items-center justify-between mb-3 cursor-pointer"
                  onClick={() => setCollapsedSections({ ...collapsedSections, metrics: !collapsedSections.metrics })}
                >
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Metrics
                  </h3>
                  <span className={`text-gray-400 transition-transform ${collapsedSections.metrics ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
                {!collapsedSections.metrics && (
                  <div>
                    <div className="mb-3">
                      <button
                        onClick={clearAllMetrics}
                        className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        Clear
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Choose which series to display in the column chart.
                    </p>
                    <div className="space-y-2">
                      {metricsConfig.map((metric) => (
                        <label
                          key={metric.id}
                          className={`flex items-center gap-2 p-2 rounded-full border cursor-pointer transition-colors ${
                            activeMetricIds.has(metric.id)
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-70'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={activeMetricIds.has(metric.id)}
                            onChange={() => toggleMetric(metric.id)}
                            className="hidden"
                          />
                          <span
                            className="w-3 h-3 rounded-full border-2"
                            style={{
                              backgroundColor: activeMetricIds.has(metric.id) ? metric.color : 'transparent',
                              borderColor: metric.color,
                            }}
                          />
                          <span className="text-xs text-gray-700 dark:text-gray-300 tabular-nums">
                            {metric.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Time Periods Section */}
            {parsedRows.length > 0 && currentChartType !== 'thumbnails' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div 
                  className="flex items-center justify-between mb-3 cursor-pointer"
                  onClick={() => setCollapsedSections({ ...collapsedSections, timePeriods: !collapsedSections.timePeriods })}
                >
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Time periods
                  </h3>
                  <span className={`text-gray-400 transition-transform ${collapsedSections.timePeriods ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
                {!collapsedSections.timePeriods && (
                  <div>
                    <div className="mb-3 flex gap-2">
                      <button
                        onClick={selectAllDates}
                        className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        Select all
                      </button>
                      <button
                        onClick={clearAllDates}
                        className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        Clear
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Toggle individual dates (rows) on or off.
                    </p>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {parsedRows.map((row) => (
                        <label
                          key={row.DateKey}
                          className={`flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${
                            activeDateKeys.has(row.DateKey)
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={activeDateKeys.has(row.DateKey)}
                            onChange={() => toggleDate(row.DateKey)}
                            className="mr-2"
                          />
                          <span className="text-xs text-gray-700 dark:text-gray-300 tabular-nums flex-1">
                            {row.DateDisplay}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {parsedRows.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Controls will appear once a CSV is uploaded.
                </p>
              </div>
            )}
            
            {parsedRows.length > 0 && currentChartType === 'thumbnails' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  All metrics are displayed in Thumbnails view.
                </p>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {/* Chart Toolbar */}
              {parsedRows.length > 0 && metricsConfig.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">Chart type:</span>
                    <div className="inline-flex border border-gray-300 dark:border-gray-600 rounded-full overflow-hidden">
                      <button
                        onClick={() => setCurrentChartType('bar')}
                        className={`px-3 py-1 text-xs transition-colors ${
                          currentChartType === 'bar'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <BarChart3 size={14} className="inline mr-1" />
                        Columns
                      </button>
                      <button
                        onClick={() => setCurrentChartType('line')}
                        className={`px-3 py-1 text-xs border-l border-gray-300 dark:border-gray-600 transition-colors ${
                          currentChartType === 'line'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <TrendingUp size={14} className="inline mr-1" />
                        Lines
                      </button>
                      <button
                        onClick={() => setCurrentChartType('table')}
                        className={`px-3 py-1 text-xs border-l border-gray-300 dark:border-gray-600 transition-colors ${
                          currentChartType === 'table'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Table size={14} className="inline mr-1" />
                        Table
                      </button>
                      <button
                        onClick={() => setCurrentChartType('thumbnails')}
                        className={`px-3 py-1 text-xs border-l border-gray-300 dark:border-gray-600 transition-colors ${
                          currentChartType === 'thumbnails'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Grid size={14} className="inline mr-1" />
                        Thumbnails
                      </button>
                    </div>
                  </div>
                  {currentChartType !== 'table' && currentChartType !== 'thumbnails' && (
                    <button
                      onClick={exportChart}
                      className="inline-flex items-center gap-2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 text-xs text-gray-700 dark:text-gray-300"
                    >
                      <Download size={14} />
                      Export PNG
                    </button>
                  )}
                </div>
              )}

              {/* Chart/Table/Thumbnails */}
              <div className="relative min-h-[400px]">
                {currentChartType === 'table' && hasData && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                          {activeMetrics.map((m) => (
                            <th key={m.id} className="text-right p-3 font-semibold text-gray-600 dark:text-gray-400">
                              {m.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.map((row, idx) => (
                          <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="p-3 text-gray-900 dark:text-white">{row.DateDisplay}</td>
                            {activeMetrics.map((m) => {
                              const raw = row[m.field]
                              let val = 0
                              if (typeof raw === "string") {
                                val = parseFloat(raw.replace(/,/g, "")) || 0
                              } else if (typeof raw === "number" && Number.isFinite(raw)) {
                                val = raw
                              }
                              return (
                                <td key={m.id} className="p-3 text-right text-gray-700 dark:text-gray-300 tabular-nums">
                                  {val.toLocaleString()}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {currentChartType === 'thumbnails' && hasData && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {metricsConfig.map((metric, metricIndex) => {
                      const data = filteredRows.map((row) => {
                        const raw = row[metric.field]
                        if (typeof raw === "string") {
                          return parseFloat(raw.replace(/,/g, "")) || 0
                        }
                        return typeof raw === "number" && Number.isFinite(raw) ? raw : 0
                      })
                      const labels = filteredRows.map((row) => row.DateDisplay)
                      
                      return (
                        <ThumbnailChart
                          key={metric.id}
                          metric={metric}
                          labels={labels}
                          data={data}
                          thumbnailChartsRef={thumbnailChartsRef}
                          index={metricIndex}
                        />
                      )
                    })}
                  </div>
                )}

                {(currentChartType === 'bar' || currentChartType === 'line') && hasData && (
                  <div className="h-[400px]">
                    <canvas ref={chartRef} />
                  </div>
                )}

                {!hasData && (
                  <div className="absolute inset-0 flex items-center justify-center text-center p-10">
                    <div>
                      <strong className="text-gray-900 dark:text-white block mb-2">No data yet.</strong>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {parsedRows.length === 0 
                          ? 'Upload a CSV file to get started.'
                          : 'Select at least one metric and one time period to display data.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

