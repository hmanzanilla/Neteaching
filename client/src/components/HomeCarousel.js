// src/components/HomeCarousel.js
import React, { useState, useEffect } from "react";
import "./HomeCarousel.css"; // Archivo CSS para estilos

const images = [
  { src: "/image1.jpg", text: "Aprende con simulaciones interactivas" },
  { src: "/image2.jpg", text: "Preparación para UNAM, UAM e IPN" },
  { src: "/image3.jpg", text: "Clases en vivo y acceso 24/7" },
  { src: "/image4.jpg", text: "Aprende con simulaciones interactivas" },
  { src: "/image5.jpg", text: "Preparación para UNAM, UAM e IPN" },
  { src: "/image6.jpg", text: "Clases en vivo y acceso 24/7" },
];

const HomeCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="carousel-container">
      <div className="carousel">
        {images.map((image, index) => (
          <div
            key={index}
            className={`slide ${index === currentIndex ? "active" : ""}`}
          >
            <img src={image.src} alt={`Slide ${index + 1}`} className="carousel-image" />
            <div className="slide-text-container">
              <p className="slide-text">{image.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Botones de navegación */}
      <button className="prev" onClick={() => setCurrentIndex((currentIndex - 1 + images.length) % images.length)}>
        ❮
      </button>
      <button className="next" onClick={() => setCurrentIndex((currentIndex + 1) % images.length)}>
        ❯
      </button>
    </div>
  );
};

export default HomeCarousel;

