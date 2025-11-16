import axios from 'axios';
import { useEffect, useState } from 'react';
import HistoricalChart from './HistoricalChart';
import RateList from './RateList';

// Funkcja pomocnicza do formatowania daty na YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

const Home = () => {
    const [rates, setRates] = useState([]);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [endDate, setEndDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        
        const fetchRates = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await axios.get(`/api/rates?date=${formatDate(endDate)}`, {
                    signal: controller.signal
                });

                if (Array.isArray(response.data)) {
                    if (response.data.length > 0) {
                        setRates(response.data);
                        if (!selectedCurrency) {
                            const defaultCurrency = response.data.find(r => r.code === 'USD') || response.data[0];
                            setSelectedCurrency({ code: defaultCurrency.code, name: defaultCurrency.currency });
                        }
                    } else {
                        setRates([]);
                        setError('No NBP data found for the selected date (possibly a future date, weekend, or holiday).');
                    }
                } else {
                    setError('Received invalid data format from the server.');
                }
            } catch (err) {
                if (err.name === 'CanceledError') return;
                console.error("Axios Error:", err);
                setError('Failed to load exchange rates.');
            } finally {
                setLoading(false);
            }
        };

        fetchRates();

        return () => controller.abort();
    }, [endDate]);

    const handleCurrencySelect = (code, name) => {
        setSelectedCurrency({ code, name });
    };

    const handleDateChange = (newDate) => {
        if (newDate && !isNaN(newDate.getTime()) && newDate <= new Date()) {
            setEndDate(newDate);
        }
    };

    // --- Renderowanie ---

    if (loading && rates.length === 0) {
        return (
            <div className="d-flex vh-100 justify-content-center align-items-center text-primary-light">
                <div className="spinner-border mr-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="sr-only">Loading...</span>
                </div>
                <h2>Loading Terminal...</h2>
            </div>
        );
    }

    return (
        <div className="container py-4 py-md-5">
            <header className="mb-4">
                <h1 className="display-4 font-weight-bold text-cyan-400">
                    Currency Exchange Terminal
                </h1>
                <p className="lead text-cyan-300-70">
                    Real-time NBP exchange rates • 14-day trend analysis
                </p>
            </header>
            
            <main>
                <section className="mb-4">
                    <div className="card shadow-sm border-0 data-card">
                        <div className="card-header">
                            <h2 className="h5 mb-0 text-cyan-100">Live Exchange Rates</h2>
                            
                            <div className="ml-auto d-flex align-items-center">
                                <div className="live-indicator">
                                    <span className="live-dot"></span>
                                    LIVE
                                </div>
                                
                                {loading && (
                                    <div className="spinner-border spinner-border-sm text-cyan-400 ml-3" role="status">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="card-body p-0">
                            {error && !loading && (
                                <div className="alert alert-warning m-3 text-center">{error}</div>
                            )}
                            {!error && (
                                <RateList 
                                    rates={rates} 
                                    onCurrencySelect={handleCurrencySelect} 
                                    selectedCode={selectedCurrency?.code}
                                />
                            )}
                        </div>
                    </div>
                </section>
                
                {selectedCurrency && (
                    <section>
                        <HistoricalChart 
                            currencyCode={selectedCurrency.code} 
                            currencyName={selectedCurrency.name}
                            endDate={endDate}
                            onDateChange={handleDateChange}
                        />
                    </section>
                )}
            </main>
            
            <footer className="text-center text-cyan-300-60 mt-5 pt-3 border-top border-cyan-500-20">
                <p>Fullstack Recruitment Task | Data provided by NBP API.</p>
            </footer>
        </div>
    );
};

export default Home;