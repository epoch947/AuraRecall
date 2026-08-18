import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/inbox(.*)',
  '/api/generate-echo(.*)',
  '/api/generate-pattern(.*)',
  '/api/inbox(.*)',
  '/api/weather(.*)',
  '/api/whisper(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm|mp3|wav)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
