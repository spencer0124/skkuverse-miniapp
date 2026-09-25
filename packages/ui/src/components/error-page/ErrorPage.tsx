/**
 * ErrorPage — full-screen error, keyed by status code.
 *
 * The copy defaults follow the Toss UX writing guide in
 * `skkuverse-app/packages/sds/TOSS_UX_GUIDE.md`: 해요체, and an error states what
 * the reader can do rather than only what failed.
 *
 * Usage:
 *   <ErrorPage statusCode={404} onPrimaryClick={goHome} />
 */
import React, { type ReactNode } from 'react';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { mergeStyles, type Style } from '../../internal/style';
import { Result } from '../result';
import { Button } from '../button';
import { WarningCircleIcon } from '../../internal/icons';

export type ErrorStatusCode = 400 | 404 | 500;

export interface ErrorPageProps {
  /** @default 500 */
  statusCode?: ErrorStatusCode;
  title?: ReactNode;
  description?: ReactNode;
  /** @default '다시 시도하기' */
  primaryLabel?: string;
  onPrimaryClick?: () => void;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
  style?: Style;
}

const copy: Record<ErrorStatusCode, { title: string; description: string }> = {
  400: { title: '요청을 처리하지 못했어요', description: '입력한 내용을 확인하고 다시 시도해 주세요.' },
  404: { title: '페이지를 찾지 못했어요', description: '주소가 바뀌었거나 삭제된 페이지예요.' },
  500: { title: '잠시 후 다시 시도해 주세요', description: '문제가 오래 이어지면 고객센터로 알려주세요.' },
};

export default function ErrorPage({
  statusCode = 500,
  title,
  description,
  primaryLabel = '다시 시도하기',
  onPrimaryClick,
  secondaryLabel,
  onSecondaryClick,
  style,
}: ErrorPageProps) {
  const adaptive = useAdaptive();
  const preset = copy[statusCode];

  return (
    <Result
      style={mergeStyles(style)}
      figure={<WarningCircleIcon size={64} weight="fill" color={adaptive.grey300} />}
      title={title ?? preset.title}
      description={description ?? preset.description}
      button={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {onPrimaryClick ? (
            <Button display="block" size="xlarge" onClick={onPrimaryClick} style={{ width: '100%' }}>
              {primaryLabel}
            </Button>
          ) : null}
          {onSecondaryClick && secondaryLabel ? (
            <Button
              display="block"
              size="xlarge"
              variant="weak"
              onClick={onSecondaryClick}
              style={{ width: '100%' }}
            >
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      }
    />
  );
}

export { ErrorPage };
