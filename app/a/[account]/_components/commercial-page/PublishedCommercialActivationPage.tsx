import type { CommercialActivationBundle } from '@/conversion-content';
import { CommercialActivationRenderer } from '@/conversion-content/commercial-activation/renderer';

import { CommercialActivationTrackingScope } from './CommercialActivationTrackingScope';

type Props = {
  accountSubdomain: string;
  bundle: CommercialActivationBundle;
  showFinancialActions: boolean;
};

export function PublishedCommercialActivationPage({
  accountSubdomain,
  bundle,
  showFinancialActions,
}: Props) {
  return (
    <CommercialActivationTrackingScope
      accountSubdomain={accountSubdomain}
      showFinancialActions={showFinancialActions}
    >
      <CommercialActivationRenderer
        composition={bundle.composition}
        contentJson={bundle.artifact.content}
        showFinancialActions={showFinancialActions}
      />
    </CommercialActivationTrackingScope>
  );
}
