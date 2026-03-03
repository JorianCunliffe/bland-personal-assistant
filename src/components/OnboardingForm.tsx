"use client";

import { useState } from "react";
// import { loadStripe } from "@stripe/stripe-js";
// import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

export default function OnboardingForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        business_name: "",
        admin_email: "",
        faq_text: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Setup Tenant and provision Twilio Number
            const res = await fetch("/api/v1/tenants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    business_name: form.business_name,
                    admin_email: form.admin_email
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // 2. Sync Knowledge Base
            if (form.faq_text && data.tenant?.tenant_id) {
                await fetch(`/api/v1/tenants/${data.tenant.tenant_id}/kb`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ raw_text: form.faq_text })
                });
            }

            setSuccess(true);
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center p-8 bg-green-50 rounded-2xl border border-green-200">
                <h3 className="text-2xl font-bold text-green-800 mb-2">You&apos;re All Set!</h3>
                <p className="text-green-700">Your AI Receptionist has been successfully provisioned.</p>
                <p className="text-sm text-green-600 mt-4 mb-6">We&apos;ve purchased a mobile number for your assistant. You will receive an email confirmation shortly.</p>

                <div className="p-6 bg-white rounded-xl shadow border border-gray-100">
                    <h4 className="font-semibold text-gray-800 mb-2">Next Step: Connect Your Calendar</h4>
                    <p className="text-sm text-gray-500 mb-4">
                        To allow your AI Receptionist to book appointments automatically, connect your Google Calendar.
                    </p>
                    <button
                        onClick={() => {
                            // In a real app we'd pass the newly created tenantId here
                            // For demo purposes, we're assuming the API returned the tenant object
                            // Let's use it to initiate the OAuth flow
                            // Normally we would save tenant_id in local storage or context
                            window.location.href = `/api/auth/google?tenantId=pending-integration`;
                        }}
                        className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded shadow-sm transition flex items-center justify-center space-x-2 mx-auto"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Connect Google Calendar</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input required type="text" name="business_name" value={form.business_name} onChange={handleChange} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Acme Logistics, LLC" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email address</label>
                <input required type="email" name="admin_email" value={form.admin_email} onChange={handleChange} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="admin@acme.com" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="w-full px-4 py-2 border rounded-xl bg-gray-50 text-gray-500 text-sm flex items-center">
                        A mobile number will be provisioned.
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calendar Setup</label>
                    <div className="w-full px-4 py-2 border rounded-xl bg-gray-50 text-gray-500 text-sm flex items-center">
                        You&apos;ll connect your calendar on the next step.
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Knowledge Base & FAQs</label>
                <textarea required rows={4} name="faq_text" value={form.faq_text} onChange={handleChange} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="We are a logistics company. Our operating hours are 9am to 5pm..."></textarea>
            </div>

            <div className="pt-4 border-t border-gray-100">
                <h4 className="font-semibold text-gray-800 mb-4">Payment Information</h4>
                <div className="p-4 bg-gray-50 border rounded-xl flex items-center justify-center text-sm text-gray-500">
                    Stripe Element placeholder (configure ENV variables for real checkout)
                </div>
            </div>

            <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition disabled:bg-opacity-50">
                {loading ? 'Provisioning AI infrastructure...' : 'Launch My AI Receptionist'}
            </button>
        </form>
    );
}
