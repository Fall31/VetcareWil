/**
 * 🎠 Carousel Component - 3D carousel for services
 * @component
 */
import React, { useState, useEffect } from 'react'
import './Carousel.css'

/**
 * Carousel Component
 * @param {object} props
 * @param {Array} props.items - Carousel items
 * @param {boolean} props.autoplay - Enable autoplay
 * @param {number} props.interval - Autoplay interval (ms)
 */
export const Carousel = ({
  items = [],
  autoplay = true,
  interval = 5000,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!autoplay || items.length === 0) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoplay, interval, items.length])

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }

  if (items.length === 0) return null

  return (
    <div className={`carousel-container ${className}`}>
      <div className="carousel-wrapper">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, index) => (
            <div key={index} className="carousel-slide">
              {item}
            </div>
          ))}
        </div>
      </div>

      <button
        className="carousel-btn carousel-btn-prev"
        onClick={goToPrevious}
        aria-label="Previous slide"
      >
        ‹
      </button>
      
      <button
        className="carousel-btn carousel-btn-next"
        onClick={goToNext}
        aria-label="Next slide"
      >
        ›
      </button>

      <div className="carousel-indicators">
        {items.map((_, index) => (
          <button
            key={index}
            className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Carousel 3D - Advanced 3D carousel
 */
export const Carousel3D = ({
  items = [],
  autoplay = true,
  interval = 4000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!autoplay || items.length === 0) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoplay, interval, items.length])

  const getCardPosition = (index) => {
    const diff = index - currentIndex
    const totalItems = items.length
    let position = diff

    if (diff > totalItems / 2) position = diff - totalItems
    if (diff < -totalItems / 2) position = diff + totalItems

    return position
  }

  if (items.length === 0) return null

  return (
    <div className="carousel-3d-container">
      <div className="carousel-3d-wrapper">
        {items.map((item, index) => {
          const position = getCardPosition(index)
          const isActive = position === 0

          return (
            <div
              key={index}
              className={`carousel-3d-card ${isActive ? 'active' : ''}`}
              style={{
                transform: `
                  translateX(${position * 320}px)
                  translateZ(${isActive ? 0 : -200}px)
                  rotateY(${position * -15}deg)
                  scale(${isActive ? 1 : 0.85})
                `,
                opacity: Math.abs(position) > 2 ? 0 : 1,
                zIndex: 100 - Math.abs(position)
              }}
              onClick={() => setCurrentIndex(index)}
            >
              {item}
            </div>
          )
        })}
      </div>

      <div className="carousel-3d-indicators">
        {items.map((_, index) => (
          <button
            key={index}
            className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default Carousel
