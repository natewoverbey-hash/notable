import Link from 'next/link'
import { Check, Search, TrendingUp, Users, Zap, Shield, BarChart3, ArrowRight, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-notable-600">
            Notable
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/sign-in" className="text-gray-600 hover:text-gray-900">
              Sign In
            </Link>
            <Link href="/sign-up" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-notable-50 text-notable-700 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            AI is changing how buyers find agents
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Are You Visible to <span className="text-notable-600">AI Assistants?</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            When buyers ask ChatGPT, Claude, or Perplexity for agent recommendations, 
            are you being mentioned? Notable monitors your AI visibility and shows you 
            exactly how to improve it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up" className="btn-primary text-lg px-8 py-3 inline-flex items-center gap-2">
              Start Your Free Scan
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium">
              View Pricing →
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • See your score in 2 minutes
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 bg-notable-200 rounded-full flex items-center justify-center text-notable-700 font-semibold">JK</div>
                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center text-green-700 font-semibold">MR</div>
                <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-semibold">DF</div>
              </div>
              <span className="text-gray-600">Trusted by top agents</span>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              ))}
              <span className="text-gray-600 ml-2">5.0 rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Way Buyers Find Agents is Changing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              More and more home buyers are asking AI assistants for agent recommendations. 
              If you are not visible, you are losing leads to competitors who are.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Buyers Ask AI First</h3>
              <p className="text-gray-600">
                "Who are the best real estate agents in [your city]?" is asked thousands of times daily on ChatGPT alone.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Picks Winners</h3>
              <p className="text-gray-600">
                AI assistants recommend only 3-5 agents per search. Everyone else is invisible.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">You Can Optimize</h3>
              <p className="text-gray-600">
                With the right strategy, you can increase your AI visibility and capture more leads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Notable Works
            </h2>
            <p className="text-xl text-gray-600">
              Get actionable insights in minutes, not months.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-10 h-10 bg-notable-100 rounded-full flex items-center justify-center text-notable-600 font-bold mb-4">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Add Your Profile</h3>
              <p className="text-gray-600">
                Tell us your name, brokerage, and the areas you serve. Takes 30 seconds.
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-10 h-10 bg-notable-100 rounded-full flex items-center justify-center text-notable-600 font-bold mb-4">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">We Scan AI Platforms</h3>
              <p className="text-gray-600">
                Notable queries ChatGPT, Claude, Gemini, and Perplexity with real buyer questions about your market.
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-10 h-10 bg-notable-100 rounded-full flex items-center justify-center text-notable-600 font-bold mb-4">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Your Score + Actions</h3>
              <p className="text-gray-600">
                See your visibility score, who is beating you, and exactly what to do to improve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Dominate AI Search
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4 p-6 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-notable-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-notable-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Visibility Score</h3>
                <p className="text-gray-600">Track your AI visibility across ChatGPT, Claude, Gemini, and Perplexity with a single score.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Competitor Intelligence</h3>
                <p className="text-gray-600">See exactly who AI is recommending instead of you and how often they appear.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Actionable Recommendations</h3>
                <p className="text-gray-600">Get specific, prioritized actions to improve your visibility. No guesswork.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Progress Tracking</h3>
                <p className="text-gray-600">Watch your visibility improve over time with trend charts and historical data.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-4 bg-notable-600">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <blockquote className="text-2xl md:text-3xl text-white font-medium mb-6">
            "I had no idea I was invisible on ChatGPT. Notable showed me that my biggest competitor 
            had 4x my visibility. Now I know exactly what to fix."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-notable-600 font-bold">JK</div>
            <div className="text-left">
              <p className="text-white font-semibold">Jackie Kelly</p>
              <p className="text-notable-200">The Cassina Group, Charleston SC</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            For less than one Zillow lead, optimize your presence across ALL AI platforms.
          </p>
          
          <div className="bg-white rounded-2xl shadow-lg border-2 border-notable-500 p-8 max-w-md mx-auto">
            <span className="inline-block bg-notable-100 text-notable-700 text-sm font-semibold px-3 py-1 rounded-full mb-4">
              Beta Access
            </span>
            <div className="flex items-baseline justify-center gap-2 mb-6">
              <span className="text-5xl font-bold text-gray-900">$29</span>
              <span className="text-gray-500">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-left">
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">AI scans across 4 platforms</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Visibility score tracking</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Competitor intelligence</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Actionable recommendations</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Early access to new features</span>
              </li>
            </ul>
            <Link href="/sign-up" className="block w-full btn-primary py-3 text-lg text-center">
              Start Your Free Scan
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              7-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Found by AI?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join agents who are already optimizing their AI visibility.
          </p>
          <Link href="/sign-up" className="btn-primary text-lg px-8 py-3 inline-flex items-center gap-2">
            Start Your Free Scan
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-notable-600">Notable</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">AI Visibility for Real Estate</span>
          </div>
          <div className="flex items-center gap-6 text-gray-600">
            <Link href="/pricing" className="hover:text-gray-900">Pricing</Link>
            <a href="mailto:support@withnotable.ai" className="hover:text-gray-900">Contact</a>
            <Link href="/sign-in" className="hover:text-gray-900">Sign In</Link>
          </div>
          <p className="text-gray-500 text-sm">
            © 2025 Notable. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
