import type { CommercialActivationBundle } from '@/conversion-content';
import { CommercialActivationRenderer } from '@/conversion-content/commercial-activation/renderer';

import { CommercialActivationTrackingScope } from './CommercialActivationTrackingScope';

type Props = {
  accountSubdomain: string;
  bundle: CommercialActivationBundle;
};

export function PublishedCommercialActivationPage({
  accountSubdomain,
  bundle,
}: Props) {
  return (
    <CommercialActivationTrackingScope accountSubdomain={accountSubdomain}>
      <CommercialActivationRenderer
        composition={bundle.composition}
        contentJson={bundle.artifact.content}
      />
    </CommercialActivationTrackingScope>
  );
}
