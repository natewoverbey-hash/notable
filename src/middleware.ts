import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth()
  }
})

export const config = {
  matcher: [
    // Skip middleware for API routes and static files
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
