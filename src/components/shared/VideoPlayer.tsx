'use client'

import { useRef, useState } from 'react'

interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
}

export function VideoPlayer({ src, poster, className = '' }: VideoPlayerProps) {
  const [started, setStarted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  function handleOverlayClick() {
    videoRef.current?.play()
    setStarted(true)
  }

  return (
    <div className={`relative aspect-video rounded-xl overflow-hidden bg-black ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls={started}
        onPlay={() => setStarted(true)}
        className="w-full h-full object-contain"
      />
      {!started && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={handleOverlayClick}
        >
          {poster && (
            <img
              src={poster}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="relative z-10 w-[60px] h-[60px] rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors">
            <span className="text-white text-2xl ml-1">▶</span>
          </div>
        </div>
      )}
    </div>
  )
}
