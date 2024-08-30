<script>
  import { LDProvider } from '@launchdarkly/svelte-client-sdk';
  import { LDFlag } from '@launchdarkly/svelte-client-sdk';
  const context = {
    kind: 'user',
    key: 'example-context-key',
    name: 'Sandy'
  };
</script>
<LDProvider clientID="" {context}>
  <LDFlag flag={'example-flag'}>
    <div slot="true">
      <p>this will render if the feature flag is on</p>
    </div>
    <div slot="false">
      <p>this will render if the feature flag is off</p>
    </div>
  </LDFlag>
</LDProvider>
