import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import EsewaModal from "./EsewaModal";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const PERIOD_LABELS = {
  "1 month": "/ month",
  "3 month": "/ 3 months",
  "6 month": "/ 6 months",
  year: "/ year",
};

const PLAN_OPTIONS = [
  { name: "Starter", price: "1500", currency: "NPR", period: "1 month" },
  { name: "Growth", price: "3900", currency: "NPR", period: "3 month" },
  { name: "Professional", price: "7200", currency: "NPR", period: "6 month" },
  { name: "Enterprise", price: "13000", currency: "NPR", period: "year" },
];

const PLAN_LOOKUP = PLAN_OPTIONS.reduce((acc, plan) => {
  acc[plan.name.toLowerCase()] = plan;
  return acc;
}, {});

function normalizePlan(subscription) {
  const rawName = subscription?.planName || "Starter";
  const basePlan = PLAN_LOOKUP[rawName.toLowerCase()] || PLAN_OPTIONS[0];

  return {
    ...basePlan,
    name: rawName,
    price:
      subscription?.amount !== undefined && subscription?.amount !== null
        ? String(subscription.amount)
        : basePlan.price,
  };
}

const RenewSubscription = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");

  const hasPlanFromRoute = Boolean(location.state?.plan);

  const [selectedPlan, setSelectedPlan] = useState(
    location.state?.plan || PLAN_OPTIONS[0],
  );

  const [formData, setFormData] = useState({
    orgName: currentUser?.orgName || "",
    fullName: currentUser?.fullName || "",
    billingEmail: currentUser?.email || "",
    phone: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      orgName: currentUser?.orgName || prev.orgName,
      fullName: currentUser?.fullName || prev.fullName,
      billingEmail: currentUser?.email || prev.billingEmail,
    }));
  }, [currentUser?.email, currentUser?.fullName, currentUser?.orgName]);

  useEffect(() => {
    const fetchLatest = async () => {
      if (!currentUser?.orgId) {
        return;
      }

      try {
        setIsPreparing(true);
        setLoadError("");

        const res = await fetch(
          `${API_BASE}/subscription/org/${currentUser.orgId}/latest`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        const latest = data?.subscription;

        if (!latest) {
          return;
        }

        setFormData((prev) => ({
          ...prev,
          orgName: latest.orgName || prev.orgName,
          billingEmail: latest.billingEmail || prev.billingEmail,
          phone: latest.phone || prev.phone,
        }));

        if (!hasPlanFromRoute) {
          setSelectedPlan(normalizePlan(latest));
        }
      } catch (error) {
        console.error("Failed to load latest subscription details:", error);
        setLoadError("Unable to load current subscription details.");
      } finally {
        setIsPreparing(false);
      }
    };

    fetchLatest();
  }, [currentUser?.orgId, hasPlanFromRoute, token]);

  const planPeriodLabel = useMemo(
    () => PERIOD_LABELS[selectedPlan.period] || "/ cycle",
    [selectedPlan.period],
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlanChange = (e) => {
    const selectedName = e.target.value;
    const found = PLAN_OPTIONS.find((plan) => plan.name === selectedName);
    if (found) {
      setSelectedPlan(found);
    }
  };

  const handleOpenModal = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleRenewPayment = async () => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE}/subscription/renew/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: currentUser?.orgId,
          orgName: formData.orgName,
          fullName: formData.fullName,
          billingEmail: formData.billingEmail,
          phone: formData.phone,
          amount: selectedPlan.price,
          planName: selectedPlan.name,
          period: selectedPlan.period,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        alert(data?.error || "Could not initiate renewal payment.");
        return;
      }

      const form = document.createElement("form");
      form.setAttribute("method", "POST");
      form.setAttribute("action", "https://rc-epay.esewa.com.np/api/epay/main/v2/form");

      const parameters = {
        amount: selectedPlan.price,
        tax_amount: "0",
        total_amount: selectedPlan.price,
        transaction_uuid: data.transactionUuid,
        product_code: data.productCode || "EPAYTEST",
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: `${window.location.origin}/subscription-success`,
        failure_url: `${window.location.origin}/subscription-failure`,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature: data.signature,
      };

      Object.entries(parameters).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error("Renew payment initiation failed:", error);
      alert("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNextBillingDate = (period) => {
    const date = new Date();
    if (period === "year") {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      const months = parseInt(period, 10) || 1;
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
      <div
        className="absolute top-0 w-full h-[40vh] z-0"
        style={{
          background: "linear-gradient(180deg, #f0fdfd 0%, #ffffff 100%)",
          borderBottom: "1px solid #f1f5f9",
        }}
      />

      <EsewaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPay={handleRenewPayment}
        plan={selectedPlan}
        formData={formData}
      />

      <div className="relative z-10 w-full max-w-5xl px-6 flex-grow flex flex-col justify-center items-center py-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] tracking-tight">
            Renew your subscription
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium">
            Review your current details and continue your organization plan
          </p>
          {loadError ? (
            <p className="text-xs text-amber-600 mt-2">{loadError}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-900">{selectedPlan.name}</h2>
                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                  Renewal
                </span>
              </div>

              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  NPR {selectedPlan.price}
                </span>
                <span className="text-slate-400 font-medium text-sm">{planPeriodLabel}</span>
              </div>

              <p className="text-slate-400 text-xs -mt-3 italic">
                Billed {selectedPlan.period === "year" ? "annually" : `every ${selectedPlan.period}`}
              </p>

              <hr className="my-6 border-slate-50" />

              <ul className="space-y-3 text-slate-600 text-sm">
                {["Core financial dashboards", "CSV/Excel import", "Basic reports & analytics"].map(
                  (item) => (
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
                  ),
                )}
              </ul>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Organization details</h3>

            <form onSubmit={handleOpenModal} className="space-y-3">
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
                    readOnly
                    className="w-full px-3 py-2 border border-slate-100 bg-slate-100 rounded-lg text-sm outline-none"
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
                    readOnly
                    className="w-full px-3 py-2 border border-slate-100 bg-slate-100 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

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
                    readOnly
                    className="w-full px-3 py-2 border border-slate-100 bg-slate-100 rounded-lg text-sm outline-none"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Plan
                  </label>
                  <select
                    value={selectedPlan.name}
                    onChange={handlePlanChange}
                    className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg text-sm focus:ring-2 focus:ring-[#4cb2b3] outline-none appearance-none cursor-pointer"
                  >
                    {PLAN_OPTIONS.map((plan) => (
                      <option key={plan.name} value={plan.name}>
                        {plan.name} - NPR {plan.price} ({plan.period})
                      </option>
                    ))}
                  </select>
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

              <div className="bg-[#4cb2b3]/5 border border-[#4cb2b3]/10 p-3 rounded-xl mt-4">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      Amount Due
                    </span>
                    <span className="text-slate-900 font-extrabold text-lg">NPR {selectedPlan.price}</span>
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPreparing || isSubmitting}
                  className="w-full bg-[#4cb2b3] text-white font-bold py-3.5 rounded-xl hover:bg-[#3d9899] transition-all shadow-lg shadow-teal-100 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Processing..." : "Complete Renewal"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="w-full mt-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600"
                >
                  ← Back to profile
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewSubscription;
