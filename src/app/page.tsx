import OnboardingForm from "../components/OnboardingForm";

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-xl w-full">

                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                        Nexus AI Receptionist
                    </h1>
                    <p className="mt-3 text-gray-600 text-lg">
                        Never miss a call again. Automate scheduling and inquiries instantly.
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 pt-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Setup your assistant</h2>
                    <OnboardingForm />

                </div>

                <p className="text-center text-gray-400 text-sm mt-8">
                    Powered by Bland.ai, Twilio, and Stripe.
                </p>

            </div>
        </div>
    );
}
