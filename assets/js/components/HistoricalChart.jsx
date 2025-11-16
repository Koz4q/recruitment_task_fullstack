import axios from 'axios';
import {
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Funkcje pomocnicze
const formatDate = (date) => date.toISOString().split('T')[0];
const formatShortDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

 // Wyświetla wykres historyczny dla wybranej waluty i daty.

const HistoricalChart = ({ currencyCode, currencyName, endDate, onDateChange }) => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isBuyable, setIsBuyable] = useState(true);

    useEffect(() => {
        if (!currencyCode || !endDate) return;

        const controller = new AbortController();
        const formattedDate = formatDate(endDate);

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            setChartData(null);
            
            try {
                const response = await axios.get(
                    `/api/rates/${currencyCode}/history?endDate=${formattedDate}&days=14`, 
                    { signal: controller.signal }
                );

                if (Array.isArray(response.data) && response.data.length > 0) {
                    processChartData(response.data);
                } else {
                    setError('No historical data found for the selected range.');
                }
            } catch (err) {
                if (err.name === 'CanceledError') return;
                console.error("History Error:", err);
                setError('Failed to fetch historical data.');
            } finally {
                setLoading(false);
            }
        };

        const processChartData = (history) => {
            const labels = history.map(day => day.date); 
            const sellRates = history.map(day => day.sellRate);
            const buyRates = history.map(day => day.buyRate).filter(rate => rate !== null);
            
            setIsBuyable(buyRates.length > 0);

            setChartData({
                labels: labels,
                datasets: [
                    {
                        label: 'SELL RATE',
                        data: sellRates,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.1,
                        fill: true,
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: '#020617',
                        pointRadius: 5,
                        pointBorderWidth: 2,
                        pointHoverRadius: 8,
                        pointHoverBorderWidth: 3,
                    },
                    ...(buyRates.length > 0 ? [{
                        label: 'BUY RATE',
                        data: buyRates,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.1,
                        fill: true,
                        // borderDash: [5, 5], <-- I USUNIĘTE STĄD
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#020617',
                        pointRadius: 5,
                        pointBorderWidth: 2,
                        pointHoverRadius: 8,
                        pointHoverBorderWidth: 3,
                    }] : [])
                ]
            });
        };

        fetchHistory();

        return () => controller.abort();
    }, [currencyCode, endDate]);

    const handleDateInputChange = (event) => {
        const newDate = new Date(event.target.value);
        onDateChange(newDate);
    };
    
    const cardTitle = isBuyable 
        ? "Historical Analysis: Buy / Sell (14 days)"
        : "Historical Analysis: Sell Only (14 days)";

    return (
        <div className="card shadow-sm border-0 data-card">
            <div className="card-header">
                <div>
                    <h2 className="h5 mb-0 text-cyan-100">
                        {cardTitle}
                    </h2>
                    <p className="text-cyan-300-60 text-sm mb-0">
                        For: <span className="font-weight-bold">{currencyName} ({currencyCode})</span>
                    </p>
                </div>
                
                <div className="ml-auto">
                    <input
                        type="date"
                        className="form-control form-control-dark chart-datepicker"
                        value={formatDate(endDate)}
                        onChange={handleDateInputChange}
                        max={formatDate(new Date())}
                    />
                </div>
            </div>
            <div className="card-body">
                {loading && (
                    <div className="d-flex justify-content-center align-items-center p-5" style={{ minHeight: '350px' }}>
                        <div className="spinner-border text-primary-light" role="status">
                            <span className="sr-only">Loading chart...</span>
                        </div>
                    </div>
                )}
                {error && <p className="alert alert-warning text-center">{error}</p>}
                
                {!loading && !error && chartData && (
                    <div style={{ height: '350px', position: 'relative' }}>
                        <Line
                            data={chartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                interaction: {
                                    mode: 'index',
                                    intersect: false,
                                },
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { 
                                            color: '#94a3b8',
                                            usePointStyle: true,
                                            padding: 20,
                                        }
                                    },
                                    tooltip: {
                                        backgroundColor: '#0f172a',
                                        borderColor: '#06b6d4',
                                        borderWidth: 1,
                                        padding: 12,
                                        titleFont: { family: "'Space Mono', monospace", size: 14 },
                                        bodyFont: { family: "'Space Mono', monospace", size: 12 },
                                        displayColors: false,
                                        callbacks: {
                                            title: (tooltipItems) => {
                                                return tooltipItems[0].label;
                                            },
                                            label: (context) => {
                                                const label = context.dataset.label || '';
                                                const value = context.parsed.y.toFixed(4);
                                                
                                                if (label.includes('BUY')) {
                                                    return ` ▼ BUY: ${value}`;
                                                }
                                                if (label.includes('SELL')) {
                                                    return ` ▲ SELL: ${value}`;
                                                }
                                                return null;
                                            },
                                            labelTextColor: (context) => {
                                                const label = context.dataset.label || '';
                                                if (label.includes('BUY')) {
                                                    return '#10b981'; // Zielony
                                                }
                                                return '#ef4444'; // Czerwony
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        ticks: {
                                            callback: (value) => `${value.toFixed(4)} PLN`,
                                            color: '#94a3b8',
                                            maxTicksLimit: 6,
                                        },
                                        grid: { 
                                            color: 'rgba(51, 65, 85, 0.5)',
                                            borderDash: [5, 5]
                                        }
                                    },
                                    x: {
                                        ticks: { 
                                            color: '#94a3b8',
                                            maxRotation: 0,
                                            autoSkip: true,
                                            maxTicksLimit: 10,
                                            callback: function(value) {
                                                const label = this.getLabelForValue(value); 
                                                return formatShortDate(label);
                                            }
                                        },
                                        grid: { 
                                            color: 'rgba(51, 65, 85, 0.5)',
                                            borderDash: [5, 5]
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoricalChart;