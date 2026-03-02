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
        area_code: "415",
        calendar_link: "",
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
                    admin_email: form.admin_email,
                    area_code: form.area_code
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
                <h3 className="text-2xl font-bold text-green-800 mb-2">You're All Set!</h3>
                <p className="text-green-700">Your AI Receptionist has been successfully provisioned.</p>
                <p className="text-sm text-green-600 mt-4">We've purchased a number in area code {form.area_code}. You will receive an email confirmation shortly.</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desired Area Code</label>
                    <input required type="text" maxLength={3} name="area_code" value={form.area_code} onChange={handleChange} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="e.g. 415" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Booking Link</label>
                    <input type="url" name="calendar_link" value={form.calendar_link} onChange={handleChange} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="https://calendar.google.com/..." />
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
