import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// eBay Marketplace Account Deletion compliance endpoint
// Required to activate Production API keys

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challengeCode = searchParams.get('challenge_code')

  if (!challengeCode) {
    return NextResponse.json({ error: 'Missing challenge_code' }, { status: 400 })
  }

  const verificationToken = process.env.EBAY_VERIFICATION_TOKEN
  const endpoint = process.env.EBAY_DELETION_ENDPOINT

  if (!verificationToken || !endpoint) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  // eBay expects: SHA-256 hash of (challengeCode + verificationToken + endpoint)
  const hash = crypto
    .createHash('sha256')
    .update(challengeCode + verificationToken + endpoint)
    .digest('hex')

  return NextResponse.json({ challengeResponse: hash })
}

export async function POST(request: NextRequest) {
  // eBay sends account deletion notifications here
  // For compliance we just acknowledge receipt — no user data to delete since
  // VAULT doesn't store eBay user accounts
  return NextResponse.json({ received: true }, { status: 200 })
}
