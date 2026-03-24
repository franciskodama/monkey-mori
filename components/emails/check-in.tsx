import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Heading,
  Button,
  Link,
  Img,
} from '@react-email/components';

interface CheckInEmailProps {
  userName: string;
  checkInUrl: string;
  baseUrl: string;
}

export default function CheckInEmail({
  userName,
  checkInUrl,
  baseUrl,
}: CheckInEmailProps) {
  const logoUrl = `${baseUrl}/logo/monkey-mori-300x300.png`;

  return (
    <Html>
      <Head />
      <Preview>Monkey Mori: Time for your scheduled check-in 🐒</Preview>
      <Body
        style={{
          backgroundColor: '#020617',
          margin: 'auto',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '40px 20px',
        }}
      >
        <Container
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <Img
            src={logoUrl}
            width="80"
            height="80"
            alt="Monkey Mori Logo"
            style={{
              margin: '0 auto 24px',
              borderRadius: '16px',
              border: '1px solid #1e293b',
              objectFit: 'cover'
            }}
          />
          <Heading
            style={{
              color: '#f8fafc',
              fontSize: '28px',
              margin: '0 0 20px',
              fontWeight: 'bold',
            }}
          >
            Time for your check-in, {userName}! 🐒
          </Heading>

          <Text
            style={{
              color: '#cbd5e1',
              fontSize: '16px',
              lineHeight: '24px',
              marginBottom: '36px',
            }}
          >
            This is your routine check-in for the Monkey Mori dead man's switch.
            To keep your private vault locked and reset the escalation timer,
            please verify that you are still active by clicking the secure
            button below.
          </Text>

          <Button
            href={checkInUrl}
            style={{
              backgroundColor: '#4f46e5',
              padding: '16px 32px',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            I'm Still Active
          </Button>

          <Text
            style={{
              color: '#64748b',
              fontSize: '13px',
              marginTop: '40px',
              lineHeight: '20px',
            }}
          >
            If you do not check in before the final escalation threshold, your{' '}
            <b>PRIVATE</b> vault will automatically unlock for your household
            partner.
            <br /> <br />
            If the button above does not work, copy and paste this link into
            your browser: <br />
            <Link
              href={checkInUrl}
              style={{ color: '#3b82f6', wordBreak: 'break-all' }}
            >
              {checkInUrl}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
