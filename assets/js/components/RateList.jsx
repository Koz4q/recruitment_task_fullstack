const RateList = ({ rates, onCurrencySelect, selectedCode }) => {

    if (!rates || rates.length === 0) {
        return null; 
    }

    const handleSelectChange = (code, currency) => {
        onCurrencySelect(code, currency);
    };

    return (
        <div className="table-responsive">
            <table className="table table-dark-custom table-hover mb-0">
                <thead>
                    <tr>
                        <th scope="col">Code</th>
                        <th scope="col">Currency Name</th>
                        <th scope="col" className="text-right">Mid Rate</th>
                        <th scope="col" className="text-right">Buy Rate</th>
                        <th scope="col" className="text-right">Sell Rate</th>
                        <th scope="col" className="text-center">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {rates.map(rate => (
                        <tr key={rate.code} className={rate.code === selectedCode ? 'table-active-cyan' : ''}>
                            <td className="font-weight-bold align-middle">
                                <span className="currency-dot"></span>
                                {rate.code}
                            </td>
                            <td className="align-middle text-cyan-300">{rate.currency}</td>
                            <td className="align-middle text-right font-monospace">
                                {rate.mid_rate_nbp.toFixed(4)}
                            </td>
                            <td className="align-middle text-right font-monospace">
                                {rate.is_buying 
                                    ? <span className="rate-buy">{rate.buy_rate.toFixed(4)}</span> 
                                    : <span className="rate-disabled">NOT AVAILABLE</span>}
                            </td>
                            <td className="align-middle text-right font-monospace">
                                <span className="rate-sell">{rate.sell_rate.toFixed(4)}</span>
                            </td>
                            <td className="text-center align-middle">
                                <button 
                                    className="btn btn-sm btn-analyze"
                                    onClick={() => handleSelectChange(rate.code, rate.currency)}
                                >
                                    Analyze
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RateList;