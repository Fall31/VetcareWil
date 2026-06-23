import './DoctorCard.css'

const DoctorCard = ({ doctor, onReserve }) => {
  return (
    <div className="doctor-card">
      <div className="avatar">{doctor.photo ? <img src={doctor.photo} alt="doc" /> : <div className="initial">{doctor.name.split(' ')[1][0]}</div>}</div>
      <div className="doctor-info">
        <div className="doctor-name">{doctor.name}</div>
        <div className="doctor-specialty">{doctor.specialty}</div>
        <button className="btn-secondary" onClick={onReserve}>Reservar</button>
      </div>
    </div>
  )
}

export default DoctorCard
