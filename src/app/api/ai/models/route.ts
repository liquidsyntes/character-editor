import { NextRequest, NextResponse } from 'next/server';
import { getServerSideApiKeys } from '@/lib/settingsActions';
import { PROVIDER_CONFIGS, AiProvider } from '@/lib/ai/provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider') as AiProvider;

  if (!provider || !PROVIDER_CONFIGS[provider]) {
    return NextResponse.json({ models: [] }, { status: 400 });
  }

  const cfg = PROVIDER_CONFIGS[provider];
  const cookieKeys = await getServerSideApiKeys();
  const apiKey = cookieKeys[provider] || cfg.apiKey;

  if (!apiKey) {
    return NextResponse.json({ models: [] });
  }

  try {
    let url = '';
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    if (provider === 'openai' || provider === 'xai' || provider === 'deepseek') {
      if (provider === 'openai' || provider === 'xai') url = `${cfg.baseUrl}/v1/models`;
      if (provider === 'deepseek') url = `${cfg.baseUrl}/models`;
      
      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        const dataList = (Array.isArray(json.data) ? json.data : []) as unknown[];
        const models = dataList.map((mItem: unknown) => {
          const m = mItem as Record<string, unknown>;
          return {
            id: String(m.id || ''),
            label: String(m.name || m.id || '')
          };
        });
        
        // Remove duplicates and sort
        const uniqueModels = Array.from(new Map(models.map((m: { id: string; label: string }) => [m.id, m])).values());
        return NextResponse.json({ models: uniqueModels });
      }
    }
    
    return NextResponse.json({ models: [] });
  } catch {
    return NextResponse.json({ models: [] });
  }
}
