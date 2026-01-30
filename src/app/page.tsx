import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { ArrowRight, Search, BarChart3, TrendingUp, Shield } from 'lucide-react'

export default async function HomePage() {
  const { userId } = auth()

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-notable-600">Notable</span>
            </div>
            <div className="flex items-center gap-4">
              {userId ? (
                <Link href="/dashboard" className="btn-primary">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="text-gray-600 hover:text-gray-900">
                    Sign In
                  </Link>
                  <Link href="/sign-up" className="btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight">
            Are you <span className="text-notable-600">visible</span> to AI?
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            When buyers ask ChatGPT "Who's the best realtor in {'{'}your city{'}'}" — do you show up?
            Notable monitors your AI visibility across ChatGPT, Claude, Gemini, and Perplexity.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up" className="btn-primary text-lg px-8 py-3 inline-flex items-center justify-center">
              Start Free Audit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="#how-it-works" className="btn-secondary text-lg px-8 py-3">
              See How It Works
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            No credit card required • See your AI visibility score in 2 minutes
          </p>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">The way buyers find agents is changing</h2>
            <p className="mt-4 text-lg text-gray-600">And most agents have no idea if they're being recommended.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="text-4xl font-bold text-notable-600">51%</div>
              <p className="mt-2 text-gray-600">of Gen Z start product research in AI chatbots, not Google</p>
            </div>
            <div className="card text-center">
              <div className="text-4xl font-bold text-notable-600">60%</div>
              <p className="mt-2 text-gray-600">of Google searches are now zero-click (answered by AI)</p>
            </div>
            <div className="card text-center">
              <div className="text-4xl font-bold text-notable-600">4,700%</div>
              <p className="mt-2 text-gray-600">increase in traffic from AI platforms to businesses (2024-2025)</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">How Notable Works</h2>
            <p className="mt-4 text-lg text-gray-600">Get visibility into what AI says about you in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-notable-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-notable-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">1. Add Your Profile</h3>
              <p className="mt-2 text-gray-600">
                Enter your name, city, and specialties. We'll monitor how AI responds to 95+ buyer questions.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-notable-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-8 w-8 text-notable-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">2. See Your Score</h3>
              <p className="mt-2 text-gray-600">
                Get a 0-100 visibility score across ChatGPT, Claude, Gemini, and Perplexity. See who's mentioned instead of you.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-notable-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-notable-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">3. Track Progress</h3>
              <p className="mt-2 text-gray-600">
                Monitor changes over time. Get recommendations on how to improve your AI presence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything You Need to Dominate AI Search</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Search, title: 'Multi-LLM Monitoring', desc: 'Track ChatGPT, Claude, Gemini, Perplexity & Google AI Overviews' },
              { icon: BarChart3, title: 'Visibility Score', desc: '0-100 score showing how often AI recommends you' },
              { icon: TrendingUp, title: 'Competitor Tracking', desc: 'See who AI recommends instead of you' },
              { icon: Shield, title: 'Custom Prompts', desc: 'Add your own questions to track hyperlocal visibility' },
            ].map((feature, i) => (
              <div key={i} className="card">
                <feature.icon className="h-10 w-10 text-notable-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-notable-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to see your AI visibility?</h2>
          <p className="mt-4 text-lg text-notable-100">
            Get your free audit in 2 minutes. No credit card required.
          </p>
          <Link href="/sign-up" className="mt-8 inline-flex items-center bg-white text-notable-600 font-semibold py-3 px-8 rounded-lg hover:bg-notable-50 transition-colors">
            Start Free Audit
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-2xl font-bold text-notable-600">Notable</div>
            <p className="mt-4 md:mt-0 text-gray-500 text-sm">
              © {new Date().getFullYear()} Notable. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
