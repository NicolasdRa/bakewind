import { Component, For } from 'solid-js';
import { A } from '@solidjs/router';
import { Text } from '~/components/common/Typography';
import styles from './FormFooter.module.css';

export interface FormFooterLink {
  href: string;
  text: string;
  variant?: 'primary' | 'secondary';
  external?: boolean;
}

interface FormFooterProps {
  links: FormFooterLink[];
}

const FormFooter: Component<FormFooterProps> = (props) => {
  return (
    <div class={styles.container}>
      <For each={props.links}>
        {(link) => (
          link.external ? (
            <a href={link.href} class={styles[link.variant || 'primary']}>
              <Text as="span" variant="body-sm">{link.text}</Text>
            </a>
          ) : (
            <A href={link.href} class={styles[link.variant || 'primary']}>
              <Text as="span" variant="body-sm">{link.text}</Text>
            </A>
          )
        )}
      </For>
    </div>
  );
};

export default FormFooter;
