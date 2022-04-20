import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { shell } from 'electron';
import PropTypes from 'prop-types';
import React from 'react';

import CustomButton from '../../../designSystem/designComponents/buttons/button';
import CustomCheckBox from '../../../designSystem/designComponents/input/checkbox';

const PREFIX = 'InitialTermsAndUse';

const classes = {
  middle: `${PREFIX}-middle`,
  content: `${PREFIX}-content`,
  buttons: `${PREFIX}-buttons`
};

const Root = styled(Grid)(({ theme }) => ({
  [`& .${classes.middle}`]: {
    padding: '2rem',
    background: theme.palette.primary.light,
    minWidth: '80vw',
    height: '90vh',
    margin: '0rem 1.5rem',
    border: '1px solid grey',
    borderRadius: '1rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  [`& .${classes.content}`]: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    overflowY: 'scroll',
    maxWidth: '60%',
    height: '60vh'
  },
  [`& .${classes.buttons}`]: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '60%'
  }
}));

interface TermsAndUseProps {
  handleNext: () => void;
}

const TermsAndUse: React.FC<TermsAndUseProps> = ({ handleNext }) => {
  const [agreement, setAgreement] = React.useState(false);

  const handleAgreementChange = () => {
    setAgreement(!agreement);
  };

  const openPrivacyPolicy = (event: React.SyntheticEvent) => {
    event.preventDefault();
    shell.openExternal('https://cypherock.com/privacy');
  };

  return (
    <Root container>
      <Grid item xs={12} className={classes.middle}>
        <Typography variant="h2" color="textPrimary" align="center">
          Terms of Use
        </Typography>
        <Grid container className={classes.content}>
          <br />
          <br />
          <Typography variant="caption" color="textPrimary">
            NOVEMBER 29, 2020
          </Typography>
          <br />
          <br />
          <Typography color="textPrimary">
            You are about to use the CySync platform. We’re excited for you!
            Before you get on, Cypherock needs you to carefully read, understand
            and accept our Terms of Use (the or these “Terms”).
          </Typography>
          <br />
          <Typography
            variant="h5"
            color="textPrimary"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Overview
          </Typography>
          <Typography color="textPrimary">
            This agreement is between you (“you”, “your”, or “User”) and Faucet
            Labs Private Limited (“Cypherock”, “us”, “we,&apos;&apos; “our”, or
            the “Company”). By using or clicking “I agree” to any of the
            services provided by Cypherock or its affiliates in connection with
            the Cypherock CySync software (the “Cypherock Services”), you agree
            that you have carefully read and accept all of the below terms and
            conditions.
            <br />
            <br />
            Your use of Cypherock Services is also subject to Cypherock’s
            Privacy Policy, which is available at
            <Link
              href="#"
              onClick={openPrivacyPolicy}
              color="secondary"
              underline="hover"
            >
              {' '}
              https://cypherock.com/privacy.
            </Link>
            <br />
            <br />
            BEFORE USING THE SERVICES, PLEASE EDUCATE YOURSELF TO MAKE INFORMED
            DECISIONS. CRYPTO ASSETS ARE VOLATILE. THE PRICES CAN GO UP AND
            DOWN. CAREFULLY EVALUATE YOUR GOALS AND THE FINANCIAL RISK YOU ARE
            WILLING TO TAKE. PLEASE BE AWARE THAT Cypherock DOES NOT PROVIDE
            FINANCIAL, TAX, OR LEGAL ADVICE. DECISIONS TO PERFORM OPERATIONS
            INVOLVING CRYPTO ASSETS SHOULD BE TAKEN ON YOUR OWN OR RELY ON
            OPINIONS OF RELIABLE AND QUALIFIED EXPERTS.
          </Typography>
          <br />
          <br />
          <Typography
            variant="h5"
            color="textPrimary"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Definitions
          </Typography>
          <Typography color="textPrimary">
            The following terms, when used in this Agreement, shall have the
            meanings described below, it being specified for the avoidance of
            doubt that in these definitions, reference to the singular includes
            a reference to the plural and vice versa, except when clearly
            inappropriate.
            <br />
            <br />
            <strong>“Crypto Assets”</strong>
            <span>
              {` - means types of digital assets which can be transmitted with
              blockchain technologies, including but not limited to Bitcoin,
              Ethereum.`}
            </span>
            <br />
            <br />
            <strong>“Device Application”</strong>
            <span>
              {` - means a software application, developed by Cypherock or by third
                parties, which embeds a specific cryptographic signature logic
                within Cypherock’s embedded system in order to create a
                transaction, on Cypherock CySync or a third party application,
                and signs various operations with a Cypherock Device, including
                but not limited to: Crypto Assets transactions broadcast,
                authentication, password management.`}
            </span>
            <br />
            <br />
            <strong>“Fork”</strong>
            <span>
              {` - means a change to the underlying protocol of a blockchain network
              that results in more than one version of a Crypto Asset, the
              result of which may be one or more versions that are not supported
              on Cypherock Services.`}
            </span>
            <br />
            <br />
            <strong>“Cypherock Device”</strong>
            <span>
              {` - means an electronic device coupled with Javacard-based Smartcards,
              developed and distributed by Cypherock, generally referred to as a
              “hardware wallet”, used to manage and secure Users’ Private Keys
              and other cryptographic secrets, compatible with Cypherock CySync
              or compatible Wallets.`}
            </span>
            <br />
            <br />
            <strong>“Cypherock CySync”</strong>
            <span>
              {` - means a catalogue of Device Applications available for download,
              which enables Users to update their Cypherock Device firmware,
              install Device Applications and manage supported Crypto Assets.`}
            </span>
            <br />
            <br />
            <strong>“Materials”</strong>
            <span>
              {` - means content, Cypherock Service documentation as well as source
              and object codes for all software embedded within Cypherock CySync
              and Cypherock Devices.`}
            </span>
            <br />
            <br />
            <strong>“PIN”</strong>
            <span>
              {` - means the numeric password chosen by the User to unlock a
              Cypherock Device.`}
            </span>
            <br />
            <br />
            <strong>“Private Keys”</strong>
            <span>
              {` - means a critical piece of data used to authorize outgoing
              transactions on blockchain networks.`}
            </span>
            <br />
            <br />
            <strong>“Services”</strong>
            <span>
              {` - means one or more of the Cypherock Services or Third Party
              Services.`}
            </span>
            <br />
            <br />
            <strong>“Third Party Services”</strong>
            <span>
              {` - refers to applications, softwares or other Materials that are
              hosted, developed or operated by a third party, including, but not
              limited to: cryptocurrency exchanges, staking service providers.`}
            </span>
            <br />
            <br />
            <strong>“Wallet”</strong>
            <span>
              {` - means a software program which interacts with various blockchain
              networks to generate and manage sets of private keys and public
              keys, configure transactions and monitor their balance.`}
            </span>
            <br />
            <br />
            <strong>“Website”</strong>
            <span>
              {` - means websites owned and operated by Cypherock, including the
              e-commerce and corporate website hosted at Cypherock.com`}
            </span>
            <br />
            <br />
            <strong>“24-word Recovery Phrase”</strong>
            <span>
              {` - means a confidential combination of human readable words,
              generated by Cypherock Devices, from which Users’ Private Keys are
              derived. They are used to back-up and restore access to Crypto
              Assets on other Cypherock Devices or compatible Wallets.`}
            </span>
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Eligibility
          </Typography>
          <Typography color="textPrimary">
            To be eligible to use the Services, you must be at least 18 years
            old or qualify as an adult in your country of residence. If you are
            using our Services on behalf of a legal entity, you further
            represent and warrant that: (a) the legal entity is duly organized
            and validly existing under the applicable laws of the jurisdiction
            of its organization; and (b) you are duly authorized by such legal
            entity to act on its behalf.
            <br />
            <br />
            You can only use the Services if permitted under the laws of your
            jurisdiction. Please make sure that these Terms are in compliance
            with all laws, rules, and regulations that apply to you.
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Cypherock Services
          </Typography>
          <Typography color="textPrimary">
            Cypherock CySync, in connection with Cypherock Devices, provides you
            with a convenient and secure way to manage your Device Applications
            as well as use Private Keys derived from your 24-word Recovery
            Phrase.
            <br />
            <br />
            The Cypherock Services allow Users to:
          </Typography>
          <Typography
            color="textPrimary"
            style={{
              paddingLeft: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FiberManualRecordIcon
              style={{ fontSize: 10, marginRight: '0.5rem' }}
            />
            {` Update the firmware of their Cypherock Device`}
          </Typography>
          <Typography
            color="textPrimary"
            style={{
              paddingLeft: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FiberManualRecordIcon
              style={{ fontSize: 10, marginRight: '0.5rem' }}
            />
            {` Install and uninstall Device Applications with the Cypherock
              CySync`}
          </Typography>
          <Typography
            color="textPrimary"
            style={{
              paddingLeft: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FiberManualRecordIcon
              style={{ fontSize: 10, marginRight: '0.5rem' }}
            />
            {` View their portfolio of Crypto Assets`}
          </Typography>
          <Typography
            color="textPrimary"
            style={{
              paddingLeft: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FiberManualRecordIcon
              style={{ fontSize: 10, marginRight: '0.5rem' }}
            />
            {` Access the means to perform operations on various blockchain
              networks in accordance with their respective protocol rules, such
              as but not limited to:`}
          </Typography>
          <Typography
            color="textPrimary"
            style={{
              paddingLeft: '2.5rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FiberManualRecordIcon
              style={{ fontSize: 10, marginRight: '0.5rem' }}
            />
            {` Send and receive Crypto Assets to and from Users of a dedicated
              blockchain network;`}
          </Typography>
          <Typography
            color="textPrimary"
            style={{
              paddingLeft: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FiberManualRecordIcon
              style={{ fontSize: 10, marginRight: '0.5rem' }}
            />
            {` Connect with Third Party Services, to access services such as the
            delegation of staking rights on supported proof-of-stake blockchains
            or buying crypto.`}
          </Typography>
          <br />
          <Typography color="textPrimary">
            Cypherock operates non-custodial services, which means that we do
            not store, nor do we have access to your Crypto Assets nor your
            Private Keys. We do not send or receive Crypto Assets. Any Crypto
            Asset transfer occurs on blockchain networks and not on a network
            owned or controlled by Cypherock.
            <br />
            <br />
            Cypherock CySync and Cypherock Devices are only capable of
            supporting certain Crypto Assets. The list of supported assets is
            subject to variation.
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Risk
          </Typography>
          <Typography color="textPrimary">
            You are deemed to be fully aware of all the legal norms and
            technical constraints relating to the proof-of-stake and
            proof-of-work blockchains, and to the Services. You acknowledge that
            you have been warned of the following associated risks:
            <br />
            <br />
            <strong>Regulatory changes</strong>
            <span>
              {` - Blockchain technologies are subject to continuous regulatory
                changes and scrutiny around the world, including but not limited
                to anti-money laundering and financial regulations. You
                acknowledge that certain Services, including their availability,
                could be impacted by one or more regulatory requirements.`}
            </span>
            <br />
            <br />
            <strong>Tax</strong>
            <span>
              {` - Transactions in Crypto Assets, or more
              generally Crypto Assets events, including but not limited to
              exchanges, air-drops, forks, and gains arising from staking, may
              be considered tax events according to the legislations under which
              you are subject to taxation. These rules may be unclear or subject
              to change, and you are therefore encouraged to consult your own
                    tax or accounting adviser before doing Crypto Assets events.`}
            </span>
            <br />
            <br />
            <strong>Technology</strong>
            <span>
              {` - Users understand that some of the
              technology supported or made available through the Services are
              new, untested and outside of Cypherock’s control. Advances in
              cryptography, or other technical advances such as the development
              of quantum computers, could present risks to blockchain networks
              which could result in the theft or loss of Crypto Assets. Other
              adverse changes in market forces or in the technology, broadly
              construed, may prevent or compromise Cypherock’s performance under
              these Terms.`}
            </span>
            <br />
            <br />
            <strong>Cybersecurity</strong>
            <span>
              {` - Hackers or other groups or
              organizations may attempt to interfere with Cypherock’s products
              and information systems in several ways, including without
              limitation denial of service attacks, side-channel attacks,
              spoofing, smurfing, malware attacks, or consensus-based attacks.`}
            </span>
            <br />
            <br />
            There may be additional risks that we have not foreseen or
            identified in these Terms. Before you use our Services, you are
            strongly encouraged to carefully assess whether your financial
            situation and risk tolerance is compatible with such use.
            <br />
            <br />
            For the avoidance of doubt, and notwithstanding the generality of
            the Limitation of Liability section, you hereby agree that Cypherock
            shall have no liability for any loss that incurs as a consequence of
            the risks highlighted in this section.
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700 }}
          >
            No retrieval of Private Keys
          </Typography>
          <Typography color="textPrimary">
            The only existing backup is with you. Cypherock does not have access
            to or store passwords, 24-word Recovery Phrase, Private Keys,
            passphrases, transaction history, PIN, or other credentials
            associated with your use of the Services. We are not in a position
            to help you retrieve your credentials. You are solely responsible
            for remembering, storing, and keeping your credentials in a secure
            location, away from prying eyes. Any third party with knowledge of
            one or more of your 24-word Recovery Phrase or PIN can gain control
            of the Private Keys associated with your Cypherock Device or of the
            24-word Recovery Phrase;
            <br />
            <br />
            Keep your credentials safe. When you set your Cypherock Device up,
            you must: (a) create and remember a strong PIN that you do not use
            for any other service; (b) protect and keep your 24-word Recovery
            Phrase secure and confidential; (c) protect access to your Cypherock
            Device;
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Acceptable Use
          </Typography>
          <Typography color="textPrimary">
            As a user of the Cypherock Services, we grant you a limited,
            personal, non-commercial, non-exclusive, non-transferable, and
            revocable license to use the Cypherock Services. When using
            Cypherock Services, we ask that you follow some basic rules:
            <br />
            <br />
            Do no harm. You agree (i) not to distribute any virus or other
            harmful computer code through Cypherock’s systems, (ii) not to use
            any robot, spider, crawler, scraper or other automated means or
            interface not provided by us to access Cypherock Services or to
            extract data, (iii) not to provide false, inaccurate, or misleading
            information, and (iv) not to take any action that may impose an
            unreasonable or disproportionately large load on our or any of our
            third party providers’ infrastructure.
            <br />
            <br />
            Don’t circumvent our security. You agree not to bypass, circumvent,
            or attempt to bypass or circumvent any measures that we may use to
            prevent or restrict access to Cypherock Services including, without
            limitation, Cypherock Devices connected to Cypherock Services, other
            accounts, information systems, or networks.
            <br />
            <br />
            Don’t break the law. You agree that you will not violate any laws
            when using Cypherock Services. This includes any local, provincial,
            state, federal, national, or international laws that may apply to
            you. You agree that you will not use Cypherock Services to pay for,
            support, or otherwise engage in any illegal activities including,
            but not limited to, fraud, illegal gambling, money laundering, or
            terrorist activities. You further agree not to encourage or induce
            any third party to engage in any of the activities prohibited under
            this section.
            <br />
            <br />
            Don’t interfere. You agree that you will not use or attempt to use
            another user’s Wallet without authorization, or use Cypherock
            Services in any manner that could interfere with, disrupt,
            negatively affect, or inhibit other Users from fully enjoying
            Cypherock Services, or that could damage, disable, overburden or
            impair the functioning of Cypherock Services in any manner.
            <br />
            <br />
            Any use of Cypherock Services other than as specifically authorized
            in these Terms, without our prior written permission, is strictly
            prohibited and will terminate your license to use Cypherock
            Services.
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Warranties and Disclaimers
          </Typography>
          <Typography color="textPrimary">
            Cypherock will use reasonable level of skill and care to ensure that
            Cypherock Services can be accessed by you in accordance with the
            present Terms of Use, but there are no guarantees that access and
            features will not be interrupted or that there will be no delays,
            failures, errors, omissions, corruption or loss of transmitted
            information. Cypherock Services are provided “as is” without any
            warranty of any kind, either express or implied, and in particular
            without implied warranties of merchantability, reliability, and
            fitness for a particular purpose.
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Availability of Cypherock Services
          </Typography>
          <Typography color="textPrimary">
            We may change, update or suspend the Services, temporarily or
            indefinitely, so as to carry out works including, but not limited
            to: firmware and software updates, maintenance operations,
            amendments to the servers, bug fixes etc. We will make reasonable
            efforts to give you prior notice of any significant disruption of
            Cypherock Services.
            <br />
            <br />
            Cypherock does not guarantee the correct functioning of the Services
            in the event of the installation or use of programs or applications
            that do not conform to Service specifications and technical
            standards.
            <br />
            <br />
            Please note that when a Cypherock Service is unavailable or
            suspended, you can always recover your Private Keys using your
            24-Recovery Phrase on any compatible Wallet.
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Underlying blockchain protocols
          </Typography>
          <Typography color="textPrimary">
            All transactions created through Cypherock Services are confirmed
            and recorded in associated blockchain networks. Such networks are
            decentralized peer-to-peer networks run by independent third
            parties, which Cypherock does not own, control or operate. We have
            no control over blockchain networks and, therefore, cannot and do
            not ensure that the transactions you broadcast on Cypherock Services
            will be confirmed and processed. You acknowledge that we do not
            store, send, or receive Crypto Assets and you agree that the
            transactions you configure on Cypherock Services may fail, or may be
            substantially delayed by the underlying blockchain networks.
            <br />
            <br />
            On occasions, the blockchain protocol of a given Crypto Asset may
            change, which may have consequences on its key characteristics
            including but not limited to their availability, name, security,
            valuation or the way it operates. Forks entail that forked Crypto
            Assets may be misdirected or replicated. In any such events,
            Cypherock may decide, at its discretion, to suspend support of the
            impacted Crypto Asset for as long as Cypherock deems necessary. When
            it so decides, Cypherock will endeavor to give you advance notice,
            but may not be able to. You should keep yourself apprised of such
            events and make all necessary arrangements.
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Device Applications
          </Typography>
          <Typography color="textPrimary">
            Device Applications are available for download on Cypherock CySync.
            <br />
            <br />
            Developers of Device Applications are responsible for the said
            applications and their performance, and for providing support for
            Device Applications supported on a Cypherock Device and on Cypherock
            CySync. Cypherock may perform code reviews and conduct security
            audits of Device Applications available on Cypherock CySync, which
            does not constitute any kind of endorsement nor any guarantee that
            those applications are risk-free.
            <br />
            <br />
            Cypherock does not warranty that Device Applications will be
            maintained over time and reserves the right to restrict or suspend
            access to them from Cypherock Services for any reason for as long as
            deemed necessary.
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Experimental features
          </Typography>
          <Typography color="textPrimary">
            In order to accommodate advanced Users’ requests and to build new
            features and functionalities, we have released a series of
            experimental features on Cypherock CySync. These features may not be
            complete and have not been fully tested, which may present
            heightened risks. They may contain errors or inaccuracies that could
            cause failures, corruption or loss of data and/or information. You
            can think of these features as beta features. Cypherock does not
            guarantee the stability, functionality, or long-term support of
            these features. We do not recommend to use these features unless you
            are an advanced User with strong technical skills. You expressly
            acknowledge and agree that all use of the Experimental Features is
            at your sole risk
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Transaction details
          </Typography>
          <Typography color="textPrimary">
            Do not trust. Verify. Software integrity, especially when connected
            to the Internet, is very hard to verify. Cypherock’s security model
            relies on trusted display and Smartcard Security. This is why the
            verification of the information on your Cypherock Device is
            paramount. Before you approve an operation, you must always double
            check that the information displayed on your mobile or desktop
            screen is correct and matches the information displayed on your
            Cypherock Device. Upon sending Crypto Assets, you are solely
            responsible for verifying that the recipient address, amount and
            fees are correct and that they are the same on both your computer or
            mobile and on your Cypherock Device‘s screen. You also acknowledge
            that using unverified addresses to receive Crypto Assets comes at
            your own risk.
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Third Party Services and Materials
          </Typography>
          <Typography color="textPrimary">
            Cypherock CySync may incorporate, reference or provide access to
            Third Party Services.
            <br />
            <br />
            You agree that your use of Third Party Services is subject to
            separate terms and conditions between you and the third party
            identified in Cypherock CySync. Cypherock is not responsible for any
            performance, or failure to perform the Third Party Services. It is
            your responsibility to review the third party’s terms and policies
            before using a Third Party Service. Some Third Party Services may
            request or require access to your personal data. The processing of
            such data will be handled in accordance with the relevant Third
            Party’s privacy policy and best practices.
            <br />
            <br />
            Third Party Services may not work appropriately with your software
            or Cypherock Device, and we may not be able to provide support for
            issues caused by Third Party Services. If you have questions or
            concerns about how a Third Party Service operates, or need support,
            please contact the relevant third party directly.
            <br />
            <br />
            We advise not to share any credential, password, Private Key,
            passphrase, or any other sensitive information with any Third Party
            Service without validating their legitimacy first.
            <br />
            <br />
            We retain the exclusive right to add to, modify, or cancel the
            availability of any such Third Party Service for any reason and
            without prior notice.
          </Typography>
          <br />
          <Typography color="textPrimary">
            Specific rules and obligations apply to the following Services:
            <br />
            <br />
            <strong>A. Buy Crypto services</strong>
            <br />
            <br />
            Links to Buy Crypto services are sponsored links. The existence of a
            link to or from one of Cypherock Services does not represent or
            imply any endorsement of such services.
            <br />
            <br />
            <strong>B. Delegation of staking rights</strong>
            <br />
            <br />
            Rewards. You explicitly confirm that you are aware that delegation
            of staking rights to a validator operator listed in Cypherock CySync
            does not grant to your benefit any right to request payment of any
            kind, but merely a potential right to share a reward perceived by
            the validator. Please note that lock-up periods depend on the
            validator and blockchain protocols.
            <br />
            <br />
            Validators. Cypherock reserves the right to modify the list of
            referenced validators at any time without prior notice.
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Limitation of liability
          </Typography>
          <Typography color="textPrimary">
            YOU EXPRESSLY UNDERSTAND AND AGREE THAT CYPHEROCK AND ITS DIRECTORS
            AND EMPLOYEES SHALL NOT BE LIABLE TO YOU FOR ANY DIRECT, INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL OR EXEMPLARY DAMAGES, INCLUDING,
            BUT NOT LIMITED TO, DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE,
            DATA, COST OF PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES, OR OTHER
            INTANGIBLE LOSSES, RESULTING FROM: (I) THE USE OR INABILITY TO USE
            THE SERVICES (II) ANY CHANGES MADE TO THE SERVICE OR ANY SUSPENSION
            OR CESSATION OF THE SERVICES OR ANY PART THEREOF; (III) THE
            UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR TRANSMISSIONS OR DATA;
            (IV) THE DELETION OF, CORRUPTION OF, OR FAILURE TO STORE AND/OR SEND
            OR RECEIVE YOUR TRANSMISSIONS OR DATA ON OR THROUGH THE SERVICE; AND
            (V) ANY OTHER MATTER RELATING TO THE SERVICE.
            <br />
            <br />
            THE ABOVE LIMITATIONS DO NOT APPLY IN RESPECT OF LOSS RESULTING FROM
            (A) CYPHEROCK’S FRAUD, WILFUL MISCONDUCT OR GROSS NEGLIGENCE, WILFUL
            MISCONDUCT OR FRAUD; OR (B) DEATH OR PERSONAL INJURY.
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Intellectual Property
          </Typography>
          <Typography color="textPrimary">
            Cypherock respects the intellectual property of others and we ask
            our Users to do the same. You acknowledge and agree that, with the
            exception of Materials released or anyway made available pursuant to
            public license agreements, open source, MIT, or other
            non-proprietary license schemes normally used by the Cypherock
            community, Cypherock owns all copyrights, trademarks, know-how or
            any other intellectual property rights in respect of the software,
            text, video, audio, artwork, logos, layout as well as the look and
            feel pertaining to Cypherock CySync, Device Applications, and the
            Website.
            <br />
            <br />
            You may view, print and/or download a copy of proprietary Materials
            from Cypherock Services on any single computer solely for your
            personal, informational and/or non-commercial use, provided you
            comply with all copyright and other proprietary notices.
            <br />
            <br />
            The trademarks, service marks and logos of Cypherock and others used
            in the Services (“Trademarks”) are the property of Cypherock and
            their respective owners. It is strictly prohibited to use these
            Trademarks without our express written authorisation or the express
            written authorisation of any third parties.
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Feedback
          </Typography>
          <Typography color="textPrimary">
            We welcome feedback, comments, ideas, and suggestions for
            improvements to the Services (“Feedback”). You grant to us a
            non-exclusive, worldwide, perpetual, irrevocable, fully-paid,
            royalty-free, sublicensable and transferable license under any and
            all intellectual property rights that you own or control to use,
            copy, modify, create derivative works based upon and otherwise
            exploit the Feedback for any purpose.
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Compliance and Export Control
          </Typography>
          <Typography color="textPrimary">
            Users shall comply, at their own expense, with all laws that apply
            to or result from their obligations under these Terms. By accessing
            and using the Services, you represent and warrant that you are not
            on any trade or economic sanctions lists, such as (but not limited
            to) the UN Security Council Sanctions list, designated as a
            “Specially Designated National” by OFAC (Office of Foreign Assets
            Control of the U.S. Treasury Department) or placed on the U.S.
            Commerce Department’s “Denied Persons List”.
            <br />
            <br />
            Cypherock reserves the right to select the markets and jurisdictions
            where it operates and may restrict or deny access to Cypherock
            Services in certain countries, states or territories.
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Termination
          </Typography>
          <Typography color="textPrimary">
            You may stop using the Services at any time. We reserve the right to
            suspend your access to Cypherock Services without notice if we
            believe you violated these Terms. In the event of termination
            concerning your license to use Cypherock, your obligations under
            these Terms will continue.
            <br />
            <br />
            Your access to your Wallets after termination will depend on whether
            you securely backed up your Private Keys and your Wallet address.
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Applicable law
          </Typography>
          <Typography color="textPrimary">
            These Terms will be governed by and interpreted in accordance with
            the laws of India.
            <br />
            <br />
            Any dispute, controversy, difference or claim arising out of or
            relating to this Agreement, including the existence, validity,
            interpretation, performance, breach or termination thereof or any
            dispute regarding non-contractual obligations arising out of or
            relating to it shall be referred to and finally resolved by the
            competent courts of New Delhi, India.
          </Typography>
          <br />
          <br />
          <Typography
            color="textPrimary"
            variant="h5"
            gutterBottom
            style={{ fontWeight: 700, marginTop: '1.5rem' }}
          >
            Enforcement and Assignment of Terms
          </Typography>
          <Typography color="textPrimary">
            These Terms constitute the entire and exclusive understanding and
            agreement between Cypherock and you regarding Cypherock Services,
            and supersede and replace any and all prior oral or written
            understandings or agreements between Cypherock and you regarding
            Cypherock Services. If you do not read and accept the Terms in their
            entirety you should not use or continue using Cypherock Services.
            <br />
            <br />
            We reserve the right to alter, amend or modify these Terms from time
            to time, in our sole discretion. We will provide you with notice of
            such changes by posting the amended Terms via Cypherock CySync and
            updating the &quot;Last Updated&quot; date at the top of these
            Terms. The amended Terms will be deemed effective immediately upon
            posting on Cypherock CySync.
            <br />
            <br />
            You may not assign your rights or obligations under these Terms of
            Use in whole or in part to any third party.
            <br />
            <br />
            You acknowledge and agree that Cypherock may assign its rights and
            obligations under these Terms of Use and, in such context, share or
            transfer information provided by you while using Cypherock Services
            to a third party.
            <br />
            <br />
            Would any provision of these Terms of Use or part thereof to any
            extent be or become invalid or unenforceable, such provision shall
            then be deemed separable from the remaining provisions of these
            Terms of Use and shall not affect or impair the validity or
            enforceability of the remaining provisions of these Terms of Use.
          </Typography>
          <br />
          <br />
        </Grid>
        <div className={classes.buttons}>
          <FormControlLabel
            control={
              <CustomCheckBox
                checked={agreement}
                onChange={handleAgreementChange}
                color="secondary"
              />
            }
            color="textSecondary"
            label="I have read and agree with the Terms of Use and Privacy Policy"
            style={{ width: '50%' }}
          />
          <CustomButton
            onClick={() => {
              localStorage.setItem('tnc', 'true');
              handleNext();
            }}
            disabled={!agreement}
            style={{
              textTransform: 'none',
              padding: '0.5rem 3.5rem',
              height: 'max-content'
            }}
          >
            Confirm
          </CustomButton>
        </div>
      </Grid>
    </Root>
  );
};

TermsAndUse.propTypes = {
  handleNext: PropTypes.func.isRequired
};

export default TermsAndUse;
