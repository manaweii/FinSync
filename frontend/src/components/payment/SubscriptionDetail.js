import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EsewaModal from "./EsewaModal";

const SubscriptionDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Centralised API base — consistent across all fetch calls
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // Period label map (from Code 1)
  const PERIOD_LABELS = {
    "1 month": "/ month",
    "3 month": "/ 3 months",
    "6 month": "/ 6 months",
    year: "/ year",
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState(
    location.state?.plan || {
      name: "Starter",
      price: "1500",
      currency: "NPR",
      period: "1 month",
    },
  );

  const [formData, setFormData] = useState({
    orgName: "",
    fullName: "",
    billingEmail: "",
    phone: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Intercept form submit → open confirmation modal
  const handleOpenModal = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  // Actual eSewa payment — called from EsewaModal's onPay prop
  const handleEsewaPayment = async () => {
    try {
      const response = await fetch(`${API_BASE}/subscription/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: selectedPlan.price,
          planName: selectedPlan.name,
          period: selectedPlan.period,
        }),
      });

     console.log("Initiate subscription rese status:", response.status);
      
      const data = await response.json();
      console.log("Initiate subscription response:", data);

      if (data.success) {
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
          success_url: `${window.location.origin}/subscription-success`,
          failure_url: `${window.location.origin}/subscription-failure`,
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

  // Dynamic next billing date (from Code 1)
  const getNextBillingDate = (period) => {
    const date = new Date();
    if (period === "year") {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      const months = parseInt(period) || 1;
      date.setMonth(date.getMonth() + months);
    }
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="h-screen w-full bg-[#f8fafc] flex flex-col items-center relative overflow-hidden font-sans">
      {/* Gradient background strip */}
      <div
        className="absolute top-0 w-full h-[40vh] z-0"
        style={{
          background: "linear-gradient(180deg, #f0fdfd 0%, #ffffff 100%)",
          borderBottom: "1px solid #f1f5f9",
        }}
      />

      {/* Confirmation modal — rendered via EsewaModal component */}
      <EsewaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPay={handleEsewaPayment}
        plan={selectedPlan}
        formData={formData}
      />

      <div className="relative z-10 w-full max-w-5xl px-6 flex-grow flex flex-col justify-center items-center py-4">
        {/* Page heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] tracking-tight">
            Confirm your subscription
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium">
            Review your plan and complete organization setup
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
          {/* ── Left column: Plan summary ── */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedPlan.name}
                </h2>
                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                  Active Choice
                </span>
              </div>

              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  NPR {selectedPlan.price}
                </span>
                <span className="text-slate-400 font-medium text-sm">
                  {PERIOD_LABELS[selectedPlan.period]}
                </span>
              </div>
              <p className="text-slate-400 text-xs -mt-3 italic">
                Billed{" "}
                {selectedPlan.period === "year"
                  ? "annually"
                  : "every " + selectedPlan.period}
              </p>

              <hr className="my-6 border-slate-50" />

              <ul className="space-y-3 text-slate-600 text-sm">
                {[
                  "Core financial dashboards",
                  "CSV/Excel import",
                  "Basic reports & analytics",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <svg
                      className="w-4 h-4 text-[#4cb2b3]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => navigate("/pricing")}
              className="mt-8 text-[#4cb2b3] font-bold text-xs uppercase tracking-widest hover:text-[#3d9899] text-left"
            >
              Change plan
            </button>
          </div>

          {/* ── Right column: Organisation details form ── */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Organization details
            </h3>

            <form onSubmit={handleOpenModal} className="space-y-3">
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    name="orgName"
                    required
                    value={formData.orgName}
                    onChange={handleChange}
                    placeholder="Company Name"
                    className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg text-sm focus:ring-2 focus:ring-[#4cb2b3] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Admin Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg text-sm focus:ring-2 focus:ring-[#4cb2b3] outline-none"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="billingEmail"
                    required
                    value={formData.billingEmail}
                    onChange={handleChange}
                    placeholder="email@company.com"
                    className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg text-sm focus:ring-2 focus:ring-[#4cb2b3] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone #"
                    className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg text-sm focus:ring-2 focus:ring-[#4cb2b3] outline-none"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg text-sm focus:ring-2 focus:ring-[#4cb2b3] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Method
                  </label>
                  <select className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg text-sm focus:ring-2 focus:ring-[#4cb2b3] outline-none appearance-none cursor-pointer">
                    <option>eSewa Wallet</option>
                  </select>
                </div>
              </div>

              {/* Payment summary card */}
              <div className="bg-[#4cb2b3]/5 border border-[#4cb2b3]/10 p-3 rounded-xl mt-4">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      Amount Due
                    </span>
                    <span className="text-slate-900 font-extrabold text-lg">
                      NPR {selectedPlan.price}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      Next Billing
                    </span>
                    <p className="text-[#4cb2b3] font-bold text-xs">
                      {getNextBillingDate(selectedPlan.period)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#4cb2b3] text-white font-bold py-3.5 rounded-xl hover:bg-[#3d9899] transition-all shadow-lg shadow-teal-100 active:scale-[0.98]"
                >
                  Complete Subscription
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/pricing")}
                  className="w-full mt-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600"
                >
                  ← Back to pricing
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetail;