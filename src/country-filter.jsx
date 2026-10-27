import './country-filter.css';

export function CountryFilter({id, countries, value, onChange}) {
  return <div className="sok-country-filter">
    <label htmlFor={id}>Pays</label>
    <select id={id} value={value} onChange={event => onChange(event.target.value)}>
      <option value="Tous">Tous les pays</option>
      {countries.map(country => <option key={country.name} value={country.name}>{country.name}</option>)}
    </select>
  </div>;
}
