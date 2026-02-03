import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Phone, ArrowRight, Check } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../components/ui/input-otp";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sendOtp, verifyOtp, isCustomer } = useAuth();
  
  const [step, setStep] = useState(1); // 1: phone, 2: otp
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [testOtp, setTestOtp] = useState(null);

  const from = location.state?.from?.pathname || "/";

  // Redirect if already logged in
  if (isCustomer) {
    navigate(from, { replace: true });
    return null;
  }

  const formatPhone = (value) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");
    return digits;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await sendOtp(phone);
      setStep(2);
      // Show test OTP in development (when SMS is not enabled)
      if (response.otp_for_testing) {
        setTestOtp(response.otp_for_testing);
        toast.info(`Test OTP: ${response.otp_for_testing}`);
      } else {
        toast.success("OTP sent to your phone");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue) => {
    if (otpValue.length !== 6) return;

    setLoading(true);
    try {
      await verifyOtp(phone, otpValue);
      toast.success("Login successful!");
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      const errorMsg = error.response?.data?.detail || "Invalid OTP. Please try again.";
      toast.error(errorMsg);
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value) => {
    setOtp(value);
    if (value.length === 6) {
      handleVerifyOtp(value);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 bg-white border border-stone-200 rounded-2xl shadow-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1B4D3E] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1A202C]">
            Welcome to FoodNova
          </h1>
          <p className="text-stone-500 mt-2">
            {step === 1 
              ? "Enter your phone number to continue" 
              : "Enter the OTP sent to your phone"}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#1A202C] mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-stone-500">
                  <Phone className="w-5 h-5" />
                  <span className="text-sm">+234</span>
                </div>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="8012345678"
                  className="pl-24 py-6 text-lg"
                  maxLength={11}
                  data-testid="phone-input"
                />
              </div>
              <p className="text-xs text-stone-500 mt-2">
                We'll send you a verification code via SMS
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || phone.length < 10}
              className="w-full bg-[#1B4D3E] hover:bg-[#153d31] text-white py-6 rounded-xl text-lg font-semibold"
              data-testid="send-otp-btn"
            >
              {loading ? "Sending..." : "Send OTP"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        ) : (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-stone-500">
                  OTP sent to +234{phone}
                </span>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-[#1B4D3E] font-medium hover:underline"
                >
                  Change
                </button>
              </div>

              {testOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-800">
                    <strong>Test Mode:</strong> Your OTP is <code className="bg-amber-100 px-2 py-0.5 rounded">{testOtp}</code>
                  </p>
                </div>
              )}

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={handleOtpChange}
                  disabled={loading}
                  data-testid="otp-input"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button
              onClick={() => handleVerifyOtp(otp)}
              disabled={loading || otp.length !== 6}
              className="w-full bg-[#1B4D3E] hover:bg-[#153d31] text-white py-6 rounded-xl text-lg font-semibold"
              data-testid="verify-otp-btn"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
              <Check className="w-5 h-5 ml-2" />
            </Button>

            <div className="text-center mt-4">
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="text-sm text-[#1B4D3E] font-medium hover:underline"
              >
                Didn't receive code? Resend
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-stone-400 text-center mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </Card>
    </div>
  );
};

export default LoginPage;
