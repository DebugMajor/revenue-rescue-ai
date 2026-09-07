import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandMark } from "../components/layout/Sidebar";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Signup() {
    const { register, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const validate = () => {
        if (!EMAIL_RE.test(email.trim())) {
            return "Enter a valid email address.";
        }

        if (password.length < 8) {
            return "Password must be at least 8 characters.";
        }

        if (password !== confirmPassword) {
            return "Passwords do not match.";
        }

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const validationError = validate();

        if (validationError) {
            setError(validationError);
            return;
        }

        setSubmitting(true);

        try {
            await register(email.trim(), password);

            navigate("/login", {
                replace: true,
                state: {
                    message: "Account created successfully. Please sign in."
                }
            });
        }
        catch (err) {
            if (err.status === 409) {
                setError("An account with this email already exists.");
            }
            else if (err.status === 400) {
                setError("Please enter valid account details.");
            }
            else {
                setError(
                    err.message || "Couldn't create your account."
                );
            }
        }
        finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="rr-login-shell">
            <div className="rr-login-card">

                <div className="rr-login-brand">
                    <div className="rr-sidebar-mark">
                        <BrandMark />
                    </div>

                    <div className="rr-sidebar-name">
                        Revenue Rescue
                        <span>AI Recovery Console</span>
                    </div>
                </div>

                <h1 className="rr-login-title">
                    Create an account
                </h1>

                <p className="rr-login-subtitle">
                    Set up access to the revenue recovery operations console.
                </p>

                <form onSubmit={handleSubmit}>

                    <div className="rr-field">
                        <label className="rr-field-label">
                            Email
                        </label>

                        <input
                            className="rr-input"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="rr-field">
                        <label className="rr-field-label">
                            Password
                        </label>

                        <input
                            className="rr-input"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={8}
                            required
                        />
                    </div>

                    <div className="rr-field">
                        <label className="rr-field-label">
                            Confirm password
                        </label>

                        <input
                            className="rr-input"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            minLength={8}
                            required
                        />
                    </div>

                    {error && (
                        <div className="rr-login-error">
                            {error}
                        </div>
                    )}

                    <button
                        className="rr-btn rr-btn-primary"
                        type="submit"
                        disabled={submitting}
                        style={{
                            width: "100%",
                            marginTop: 6
                        }}
                    >
                        {submitting
                            ? "Creating account..."
                            : "Create account"}
                    </button>

                </form>

                <p className="rr-login-footer-link">
                    Already have an account?{" "}
                    <Link to="/login">
                        Sign in
                    </Link>
                </p>

            </div>
        </div>
    );
}

export default Signup;