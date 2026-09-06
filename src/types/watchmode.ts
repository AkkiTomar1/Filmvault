export interface WatchmodeSource {
  source_id: number
  name: string
  type: 'sub' | 'rent' | 'buy' | 'free' | 'tve'
  region?: string
  web_url?: string | null
  pricing?: string | null
}

export interface WatchmodeOffer {
  sourceId: number
  name: string
  type: 'sub' | 'rent' | 'buy' | 'free' | 'tve'
  webUrl: string
  logoUrl: string | null
}