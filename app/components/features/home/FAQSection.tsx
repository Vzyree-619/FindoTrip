import { useState } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import PublicChatButton from '~/components/chat/PublicChatButton';
import { 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail,
  Search,
  Star,
  Shield,
  Clock,
  Users,
  MapPin,
  CreditCard,
  Calendar,
  Wifi,
  Car,
  Plane,
  Hotel
} from 'lucide-react';
import { cn } from '~/lib/utils';

const faqCategories = [
  {
    id: 'general',
    name: 'General',
    icon: HelpCircle,
    color: 'bg-blue-500',
  },
  {
    id: 'booking',
    name: 'Booking',
    icon: Calendar,
    color: 'bg-green-500',
  },
  {
    id: 'payment',
    name: 'Payment',
    icon: CreditCard,
    color: 'bg-purple-500',
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: Plane,
    color: 'bg-orange-500',
  },
];

const faqData = [
  {
    id: 1,
    category: 'general',
    question: "What is FindoTrip and how does it work?",
    answer: "FindoTrip is Pakistan's premier travel platform that connects travelers with accommodations, car rentals, and experienced tour guides. Simply search, compare, and book your perfect travel experience all in one place.",
    popular: true,
  },
  {
    id: 2,
    category: 'booking',
    question: "How do I make a booking?",
    answer: "Making a booking is simple! Search for your destination, select your preferred dates, choose from available options, and complete your booking with secure payment. You'll receive instant confirmation via email.",
    popular: true,
  },
  {
    id: 3,
    category: 'payment',
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, MasterCard), bank transfers, and digital wallets. All payments are processed securely through encrypted channels to protect your financial information.",
  },
  {
    id: 4,
    category: 'booking',
    question: "Can I cancel or modify my booking?",
    answer: "Yes! You can cancel or modify your booking up to 24-48 hours before your scheduled date, depending on the service provider's policy. Some bookings may be eligible for free cancellation.",
    popular: true,
  },
  {
    id: 5,
    category: 'payment',
    question: "When will I receive my refund?",
    answer: "Refunds are typically processed within 5-7 business days after cancellation approval. The exact timeline depends on your payment method and bank processing times.",
  },
  {
    id: 6,
    category: 'travel',
    question: "Are meals included in tour packages?",
    answer: "Most tour packages include breakfast and dinner. Specific meal inclusions vary by package - please check the detailed itinerary for each tour. Special dietary requirements can be accommodated with advance notice.",
  },
  {
    id: 7,
    category: 'travel',
    question: "What if the weather is bad during my trip?",
    answer: "We monitor weather conditions closely and will adjust itineraries to ensure your safety and enjoyment. Alternative indoor activities or rescheduling options are available when weather conditions are unfavorable.",
  },
  {
    id: 8,
    category: 'general',
    question: "How do I contact customer support?",
    answer: "You can reach our 24/7 customer support team via live chat, email at support@findotrip.com, or phone at +92-XXX-XXXXXXX. We're here to help with any questions or concerns.",
    popular: true,
  },
  {
    id: 9,
    category: 'booking',
    question: "Do I need to create an account to book?",
    answer: "While you can browse without an account, creating a free account allows you to save preferences, track bookings, access exclusive deals, and manage your travel history more easily.",
  },
  {
    id: 10,
    category: 'travel',
    question: "What should I pack for my trip?",
    answer: "Packing recommendations vary by destination and season. We provide detailed packing lists for each tour package, including weather-appropriate clothing, essential items, and any special equipment needed.",
  },
  {
    id: 11,
    category: 'payment',
    question: "Are there any hidden fees?",
    answer: "No hidden fees! All prices displayed include taxes and service charges. The final price you see during checkout is exactly what you'll pay. We believe in transparent pricing.",
  },
  {
    id: 12,
    category: 'general',
    question: "Is my personal information secure?",
    answer: "Absolutely! We use industry-standard encryption and security measures to protect your personal and payment information. We never share your data with third parties without your consent.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showChat, setShowChat] = useState(false);

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = faqCategories.find(cat => cat.id === categoryId);
    return category ? category.icon : HelpCircle;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = faqCategories.find(cat => cat.id === categoryId);
    return category ? category.color : 'bg-gray-500';
  };

  return (
    <section className="py-20 px-4 md:px-8 lg:px-16 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#01502E]/10 text-[#01502E] rounded-full text-sm font-medium mb-6">
            <HelpCircle className="h-4 w-4" />
            <span>Help Center</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked
            <span className="text-[#01502E] block">Questions</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Find answers to common questions about booking, payments, travel, and more. 
            Can't find what you're looking for? Our support team is here to help!
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "px-6 py-2 rounded-full",
              selectedCategory === 'all' 
                ? "bg-[#01502E] text-white" 
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            )}
          >
            All Questions
          </Button>
          {faqCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "px-6 py-2 rounded-full flex items-center gap-2",
                  selectedCategory === category.id 
                    ? "bg-[#01502E] text-white" 
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {category.name}
              </Button>
            );
          })}
        </div>

        {/* FAQ Grid */}
        <div className="grid gap-4 md:gap-6">
          {filteredFAQs.map((faq, index) => {
            const Icon = getCategoryIcon(faq.category);
            const categoryColor = getCategoryColor(faq.category);
            const isOpen = openIndex === index;
            
            return (
              <Card key={faq.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      {/* Category Icon */}
                      <div className={cn(
                        "p-2 rounded-lg text-white flex-shrink-0",
                        categoryColor
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      {/* Question Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#01502E] transition-colors">
                            {faq.question}
                          </h3>
                          {faq.popular && (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="capitalize">{faq.category}</span>
                          <span>•</span>
                          <span>FAQ #{faq.id}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Toggle Icon */}
                    <div className="ml-4 flex-shrink-0">
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-[#01502E]" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-[#01502E] transition-colors" />
                      )}
                    </div>
                  </button>
                  
                  {/* Answer */}
                  <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="px-6 pb-6">
                      <div className="pl-16">
                        <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#01502E]">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No Results */}
        {filteredFAQs.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No FAQs found</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search terms or category filter
            </p>
            <Button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-16 bg-gradient-to-r from-[#01502E] to-[#013d23] rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
          <p className="text-lg mb-8 opacity-90">
            Our support team is available 24/7 to help you with any questions or concerns.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg"
              className="bg-white text-[#01502E] hover:bg-gray-100"
              onClick={() => setShowChat(true)}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Live Chat
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-[#01502E]"
            >
              <Phone className="h-5 w-5 mr-2" />
              Call Support
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-[#01502E]"
            >
              <Mail className="h-5 w-5 mr-2" />
              Email Us
            </Button>
          </div>
        </div>
      </div>
      
      {/* Public Chat Modal */}
      {showChat && (
        <PublicChatButton triggerOpen={showChat} onOpenChange={setShowChat} />
      )}
    </section>
  );
}
