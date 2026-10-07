'use client'

import QRCode from 'qrcode'
import jsQR from 'jsqr'

export async function makeQrDataUrl(text: string, size = 512): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#1a1825', light: '#ffffff' },
  })
}

export async function decodeQrFromImageData(imageData: ImageData): Promise<string | null> {
  const result = jsQR(imageData.data, imageData.width, imageData.height)
  return result?.data ?? null
}

export async function decodeQrFromFile(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return await decodeQrFromImageData(imageData)
  } finally {
    URL.revokeObjectURL(url)
  }
}
