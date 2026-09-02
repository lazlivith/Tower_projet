import { useEffect, useState } from 'react';
import api from '../services/api';

export interface Service {
  id: string;
  slug: string;
  kind: 'SERVICE' | 'AMO';
  title: string;
  summary: string;
  imageUrl?: string | null;
  objective?: string | null;
  scope: string[];
  deliverables: string[];
  order: number;
  isPublished: boolean;
}

interface ServicesPayload {
  services: Service[];
  amo: Service | null;
}

const EMPTY: ServicesPayload = { services: [], amo: null };

/**
 * Charge les services vitrine publiés depuis l'API CMS.
 * `services` = prestations (kind SERVICE, triées par `order`), `amo` = encart AMO (kind AMO) ou null.
 */
export function useServices() {
  const [data, setData] = useState<ServicesPayload>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get('/cms/services')
      .then((res) => {
        if (!alive) return;
        setData({
          services: Array.isArray(res.data?.services) ? res.data.services : [],
          amo: res.data?.amo ?? null,
        });
      })
      .catch(() => alive && setData(EMPTY))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { services: data.services, amo: data.amo, loading };
}
