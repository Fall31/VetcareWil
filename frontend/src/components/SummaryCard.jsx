import './SummaryCard.css'

const SummaryCard = ({ title, value, trend, color = 'primary' }) => {
  return (
    <div className={`summary-card summary-card-${color}`}>
      <div className="summary-card-inner">
        <div className="summary-title">{title}</div>
        <div className="summary-value">{value}</div>
        {trend && <div className="summary-trend">{trend}</div>}
      </div>
      <div className="summary-decoration"></div>
    </div>
  )
}

export default SummaryCard
