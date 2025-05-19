"use client"

import { useState } from "react"
import Image from "next/image"
import { Film, User } from "lucide-react"
import type { GameItem } from "@/lib/types"

interface LegendaryFlipCardProps {
  item: GameItem
}

export function LegendaryFlipCard({ item }: LegendaryFlipCardProps) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="legendary-card-container" onMouseEnter={() => setFlipped(true)}>
      <div className={`legendary-card ${flipped ? "flipped" : ""}`}>
        <div className="legendary-card-inner">
          {/* Front side - Gold card with stars */}
          <div className="legendary-card-front">
            <div className="legendary-card-content">
              <div className="stars-container">
                <div className="star small left"></div>
                <div className="star large center"></div>
                <div className="star small right"></div>
              </div>
              <div className="legendary-label">LEGENDARY</div>
            </div>
          </div>

          {/* Back side - Actual item */}
          <div className="legendary-card-back">
            <div className="legendary-card-content">
              {item.image ? (
                <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center">
                  {item.type === "movie" ? (
                    <Film size={24} className="text-muted-foreground" />
                  ) : (
                    <User size={24} className="text-muted-foreground" />
                  )}
                </div>
              )}
              <div className="legendary-badge">
                <div className="legendary-star"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Only show the name after the card is flipped */}
      <p
        className={`text-xs text-center mt-2 truncate max-w-[80px] font-medium transition-opacity duration-500 ${flipped ? "opacity-100" : "opacity-0"}`}
        title={item.name}
      >
        {item.name}
      </p>

      {/* Add CSS for the legendary flip card animation */}
      <style jsx>{`
        .legendary-card-container {
          perspective: 1000px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .legendary-card {
          width: 64px;
          height: 88px;
          cursor: pointer;
          transform-style: preserve-3d;
          transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .legendary-card.flipped {
          transform: rotateY(180deg);
        }
        .legendary-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transform-style: preserve-3d;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .legendary-card-front, .legendary-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          border-radius: 10px;
          overflow: hidden;
        }
        .legendary-card-front {
          background: linear-gradient(135deg, #f7c52b, #e6a600);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .legendary-label {
          position: absolute;
          bottom: 8px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 8px;
          font-weight: bold;
          color: white;
          letter-spacing: 0.5px;
        }
        .legendary-card-back {
          transform: rotateY(180deg);
          background-color: white;
        }
        .legendary-card-content {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .stars-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        .star {
          position: absolute;
          background-color: white;
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        }
        .star.small {
          width: 16px;
          height: 16px;
        }
        .star.large {
          width: 24px;
          height: 24px;
        }
        .star.left {
          transform: translateX(-20px);
        }
        .star.right {
          transform: translateX(20px);
        }
        .legendary-badge {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          background-color: #f7c52b;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        .legendary-star {
          width: 12px;
          height: 12px;
          background-color: white;
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        }
      `}</style>
    </div>
  )
}
