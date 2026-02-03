'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Calendar, Clock } from 'lucide-react';

interface Feedback {
  id: string;
  positiveText: string;
  negativeText: string | null;
  serviceType: string;
  createdAt: string;
}

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      const data = await apiFetch('/api/v1/manager/feedbacks');
      setFeedbacks(data.feedbacks || []);
    } catch (error) {
      console.error('Erreur chargement feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Feedbacks</h1>
        <p className="text-muted-foreground">Consultez les avis de vos clients</p>
      </div>

      {feedbacks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun feedback pour le moment
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {feedbacks.map((feedback) => (
            <Card key={feedback.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(feedback.createdAt).toLocaleDateString('fr-FR')}
                    <Clock className="h-4 w-4 ml-2" />
                    {new Date(feedback.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <Badge variant={feedback.serviceType === 'lunch' ? 'default' : 'secondary'}>
                    {feedback.serviceType === 'lunch' ? 'Déjeuner' : 'Dîner'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <ThumbsUp className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{feedback.positiveText}</p>
                </div>
                {feedback.negativeText && (
                  <div className="flex gap-2">
                    <ThumbsDown className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{feedback.negativeText}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
