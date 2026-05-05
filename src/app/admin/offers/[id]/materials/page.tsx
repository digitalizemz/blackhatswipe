'use client'

import { useParams } from 'next/navigation'
import MaterialsClient from './materials-client'

export default function MaterialsPage() {
  const params = useParams()
  const id = params.id as string
  return <MaterialsClient offerId={id} />
}
