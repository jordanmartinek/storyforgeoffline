import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, Loader2, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      // Platform handles password reset
      await new Promise(r => setTimeout(r, 1000));
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background cinematic-bg p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">Reset Password</CardTitle>
          <CardDescription>We'll send you a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-sm">Check your email for a password reset link.</p>
              <Link to="/login" className="text-primary text-sm hover:underline">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Reset Link
              </Button>
            </form>
          )}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-primary">Back to login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
