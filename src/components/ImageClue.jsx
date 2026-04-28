function ImageClue({ location, image }) {
  if (!location) {
    return (
      <div className="image-clue">
        <div className="placeholder">Loading location...</div>
      </div>
    );
  }

  return (
    <div className="image-clue">
      <img 
        src={image} 
        alt={location.label}
        className="clue-image"
      />
      <div className="image-info">
        <h3>{location.label}</h3>
        <p className="city">{location.city}</p>
      </div>
    </div>
  );
}

export default ImageClue;
