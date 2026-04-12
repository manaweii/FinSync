import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SubscriptionDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. New State for Modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Grab the plan from state passed from PricingPage
  const [selectedPlan, setSelectedPlan] = useState(
    location.state?.plan || {
      name: "Starter",
      price: "1500",
      currency: "NPR",
      period: "/ month",
      badge: "",
      badgeColor: "",
    },
  );

  const [formData, setFormData] = useState({
    orgName: "",
    billingEmail: "",
    phone: "",
    password: "",
  });

  // Verification effect for redirects or deep links
  useEffect(() => {
    const qp = new URLSearchParams(window.location.search);
    const payload = qp.get("data");
    if (!payload) return;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL || "http://localhost:3000"}/api/subscription/verify?data=${encodeURIComponent(payload)}`,
        );
        if (!res.ok) {
          console.warn("Verify fetch failed", await res.text());
          return;
        }
        const json = await res.json();
        if (json.success && json.subscription) {
          const s = json.subscription;
          setFormData((f) => ({
            ...f,
            orgName: s.orgName || f.orgName,
            billingEmail: s.billingEmail || f.billingEmail,
          }));
          if (s.planName || s.amount) {
            setSelectedPlan({
              name: s.planName || selectedPlan.name,
              price: String(s.amount || selectedPlan.price),
              currency: "NPR",
            });
          }
        }
      } catch (err) {
        console.error("Error verifying subscription data:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Intercept form submission to show Modal first
  const handleOpenModal = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  // 3. Actual eSewa logic triggered from the Modal
  const handleEsewaPayment = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/subscription/initiate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            amount: selectedPlan.price,
            planName: selectedPlan.name,
          }),
        },
      );

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
          success_url: "http://localhost:3000/subscription-success",
          failure_url: "http://localhost:3000/subscription-failure",
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center pt-12 pb-20 px-4 relative">
      {/* --- PAYMENT DETAILS MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  Payment Details
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* <form
                action="https://rc-epay.esewa.com.np/api/epay/main/v2/form"
                method="POST"
              > */}
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between py-3 border-b border-slate-50">
                    <span className="text-slate-500 text-sm">Plan</span>
                    <span className="font-semibold text-slate-900">
                      {selectedPlan.name}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-50">
                    <span className="text-slate-500 text-sm">Organization</span>
                    <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                      {formData.orgName}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-50">
                    <span className="text-slate-500 text-sm">
                      Billing Email
                    </span>
                    <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                      {formData.billingEmail}
                    </span>
                  </div>
                  <div className="mt-6 p-5 bg-[#f0fdfd] rounded-2xl flex justify-between items-center">
                    <span className="text-teal-700 font-medium">
                      Amount due
                    </span>
                    <span className="text-2xl font-bold text-slate-900">
                      NPR {selectedPlan.price}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full mt-3 text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors"
                >
                  Cancel and Review
                </button>
                <button
                  onClick={handleEsewaPayment}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
                >
                  Pay with eSewa
                </button>
              {/* </form> */}

              {/* <button
                onClick={handleEsewaPayment}
                className="w-full bg-[#00a8c1] text-white font-bold py-4 rounded-xl hover:bg-[#008ba0] transition-all shadow-lg shadow-teal-100"
              >
                Pay with eSewa
              </button> */}
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900">
          Confirm your subscription
        </h1>
        <p className="text-slate-500 mt-2">
          Review your plan and complete organization setup
        </p>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Plan Details */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm self-start">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold text-slate-900">
              {selectedPlan.name}
            </h2>
            <span className="bg-[#dcfce7] text-[#166534] text-xs font-bold px-3 py-1 rounded-full">
              Most Popular
            </span>
          </div>

          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-5xl font-extrabold text-slate-900">
              NPR {selectedPlan.price}
            </span>
            <span className="text-slate-500 text-lg">/month</span>
          </div>
          <p className="text-slate-500 text-sm mb-8">
            Billed monthly - Cancel anytime
          </p>

          <hr className="border-slate-100 mb-8" />

          <ul className="space-y-5 mb-10">
            {[
              "Core financial dashboards",
              "CSV/Excel import",
              "Basic reports & analytics",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-slate-600">
                <svg
                  className="w-5 h-5 text-teal-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 13l4 4L19 7"
                  />
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
          <h3 className="text-xl font-bold text-slate-900 mb-8">
            Organization details
          </h3>

          <form onSubmit={handleOpenModal} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Organization name
              </label>
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Billing email
              </label>
              <input
                type="email"
                name="billingEmail"
                required
                value={formData.billingEmail}
                onChange={handleChange}
                placeholder="billing@company.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Admin Password
              </label>
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Payment method
              </label>
              <select className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-500 focus:ring-2 focus:ring-teal-500 outline-none appearance-none cursor-pointer">
                <option>eSewa Mobile Wallet</option>
              </select>
            </div>

            {/* Payment Summary Card */}
            <div className="bg-[#f0fdfd] rounded-2xl p-6 mt-8">
              <h4 className="font-bold text-slate-900 mb-4">Payment summary</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600 text-sm">
                  Amount due today:
                </span>
                <span className="font-bold text-slate-900 text-lg">
                  NPR {selectedPlan.price}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 text-sm">Next billing:</span>
                <span className="text-slate-900 text-sm font-semibold">
                  May 4, 2026
                </span>
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
