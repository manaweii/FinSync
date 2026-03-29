import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SubscriptionDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Grab the plan from state passed from PricingPage
  const selectedPlan = location.state?.plan || {
    name: "Growth Plan",
    price: "990",
    currency: "NPR",
  };

  const [formData, setFormData] = useState({
    orgName: "",
    billingEmail: "",
    password: "", // Required for admin registration[cite: 2]
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEsewaPayment = async (e) => {
    e.preventDefault();

    try {
      // 1. Initiate subscription and get eSewa signature from backend[cite: 3]
      const response = await fetch("http://localhost:5000/api/subscription/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: selectedPlan.price,
          planName: selectedPlan.name,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 2. Redirect to eSewa v2 Form[cite: 3]
        const path = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
        const form = document.createElement("form");
        form.setAttribute("method", "POST");
        form.setAttribute("action", path);

        const parameters = {
          amount: selectedPlan.price,
          tax_amount: "0",
          total_amount: selectedPlan.price,
          transaction_uuid: data.transactionUuid,
          product_code: "EPAYTEST",
          product_service_charge: "0",
          product_delivery_charge: "0",
          success_url: "http://localhost:3000/subscription-success",
          failure_url: "http://localhost:3000/pricing",
          signed_field_names: "total_amount,transaction_uuid,product_code",
          signature: data.signature,
        };

        for (const key in parameters) {
          const hiddenField = document.createElement("input");
          hiddenField.setAttribute("type", "hidden");
          hiddenField.setAttribute("name", key);
          hiddenField.setAttribute("value", parameters[key]);
          form.appendChild(hiddenField);
        }

        document.body.appendChild(form);
        form.submit();
      } else {
        alert("Registration failed: " + data.error);
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      alert("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center pt-12 pb-20 px-4">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900">Confirm your subscription</h1>
        <p className="text-slate-500 mt-2">Review your plan and complete organization setup</p>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left Column: Plan Details */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm self-start">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold text-slate-900">{selectedPlan.name}</h2>
            <span className="bg-[#dcfce7] text-[#166534] text-xs font-bold px-3 py-1 rounded-full">
              Most Popular
            </span>
          </div>

          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-5xl font-extrabold text-slate-900">NPR {selectedPlan.price}</span>
            <span className="text-slate-500 text-lg">/month</span>
          </div>
          <p className="text-slate-500 text-sm mb-8">Billed monthly - Cancel anytime</p>

          <hr className="border-slate-100 mb-8" />

          <ul className="space-y-5 mb-10">
            {["Core financial dashboards", "CSV/Excel import", "Basic reports & analytics"].map((item) => (
              <li key={item} className="flex items-center gap-3 text-slate-600">
                <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>

          <button 
            onClick={() => navigate("/pricing")}
            className="text-teal-600 font-semibold text-sm hover:underline"
          >
            Change plan
          </button>
        </div>

        {/* Right Column: Organization Details */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-8">Organization details</h3>
          
          <form onSubmit={handleEsewaPayment} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Organization name</label>
              <input
                type="text"
                name="orgName"
                required
                value={formData.orgName}
                onChange={handleChange}
                placeholder="Enter organization name"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Billing email</label>
              <input
                type="email"
                name="billingEmail"
                required
                value={formData.billingEmail}
                onChange={handleChange}
                placeholder="billing@example.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Admin Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Payment method</label>
              <select className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-500 focus:ring-2 focus:ring-teal-500 outline-none appearance-none cursor-pointer">
                <option>eSewa Mobile Wallet</option>
              </select>
            </div>

            {/* Payment Summary Card */}
            <div className="bg-[#f0fdfd] rounded-2xl p-6 mt-8">
              <h4 className="font-bold text-slate-900 mb-4">Payment summary</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600 text-sm">Amount due today:</span>
                <span className="font-bold text-slate-900 text-lg">NPR {selectedPlan.price}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 text-sm">Next billing:</span>
                <span className="text-slate-900 text-sm font-semibold">April 26, 2026</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-[#00a8c1] text-white font-bold py-4 rounded-xl hover:bg-[#008ba0] transition-colors shadow-lg shadow-teal-100"
              >
                Complete subscription
              </button>
              <button
                type="button"
                onClick={() => navigate("/pricing")}
                className="w-full mt-4 text-slate-500 text-sm font-medium hover:text-slate-800"
              >
                Back to pricing
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetail;