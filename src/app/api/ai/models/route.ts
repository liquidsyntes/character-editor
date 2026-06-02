import { NextRequest, NextResponse } from 'next/server';
import { getServerSideApiKeys } from '@/lib/settingsActions';
import { PROVIDER_CONFIGS, ProviderName } from '@/lib/ai/provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider') as ProviderName;

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
    let headers: any = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    if (provider === 'openai' || provider === 'xai' || provider === 'deepseek') {
      if (provider === 'openai' || provider === 'xai') url = `${cfg.baseUrl}/v1/models`;
      if (provider === 'deepseek') url = `${cfg.baseUrl}/models`;
      
      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        const models = (json.data || []).map((m: any) => ({
          id: m.id,
          label: m.name || m.id
        }));
        
        // Remove duplicates and sort
        const uniqueModels = Array.from(new Map(models.map((m: any) => [m.id, m])).values());
        return NextResponse.json({ models: uniqueModels });
      }
    }
    
    return NextResponse.json({ models: [] });
  } catch (err) {
    return NextResponse.json({ models: [] });
  }
}
