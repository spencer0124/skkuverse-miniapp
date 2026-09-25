/**
 * Result — full-screen outcome screen.
 *
 * A figure, a title, an optional description, and one or more actions.
 *
 * Usage:
 *   <Result figure={<CheckCircleIcon size={64} weight="fill" />} title="보냈어요"
 *           button={<Result.Button onClick={done}>확인</Result.Button>} />
 */
import React, { type ReactNode } from 'react';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap } from '../../foundation/typography';
import { mergeStyles, type Style } from '../../internal/style';
import { Button, type ButtonProps } from '../button';

export interface ResultProps {
  figure?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  button?: ReactNode;
  style?: Style;
}

function ResultRoot({ figure, title, description, button, style }: ResultProps) {
  const adaptive = useAdaptive();
  const { typography } = useTypographyTheme();

  return (
    <div
      style={mergeStyles(
        {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 12,
          minHeight: '60vh',
          padding: 24,
        },
        style,
      )}
    >
      {figure ? <div style={{ marginBottom: 8 }}>{figure}</div> : null}
      <h2 style={{
        margin: 0,
        fontFamily: FONT_FAMILY,
        fontSize: typography.t3.fontSize,
        lineHeight: `${typography.t3.lineHeight}px`,
        fontWeight: fontWeightMap.bold,
        color: adaptive.grey900,
      }}>
        {title}
      </h2>
      {description != null && (
        <p style={{
          margin: 0,
          fontFamily: FONT_FAMILY,
          fontSize: typography.t5.fontSize,
          lineHeight: `${typography.t5.lineHeight}px`,
          color: adaptive.grey600,
          whiteSpace: 'pre-line',
        }}>
          {description}
        </p>
      )}
      {button ? <div style={{ marginTop: 20, width: '100%', maxWidth: 320 }}>{button}</div> : null}
    </div>
  );
}

function ResultButton(props: Omit<ButtonProps, 'display'>) {
  return <Button display="block" size="xlarge" {...props} style={{ width: '100%' }} />;
}

export const Result = Object.assign(ResultRoot, { Button: ResultButton });

export default Result;
