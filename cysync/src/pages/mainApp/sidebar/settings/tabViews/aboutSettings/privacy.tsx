import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import DialogBox from '../../../../../../designSystem/designComponents/dialog/dialogBox';

type PrivacyProps = {
  open: boolean;
  handleClose: () => void;
};

const Privacy: React.FC<PrivacyProps> = ({ open, handleClose }) => {
  return (
    <DialogBox
      open={open}
      handleClose={handleClose}
      isClosePresent
      fullWidth
      dialogHeading="Privacy Policy"
      maxWidth="md"
      restComponents={
        <Grid container>
          <Grid item xs={1} />
          <Grid item xs={10}>
            <br />
            <br />
            <Typography color="textPrimary" gutterBottom>
              Cypherock (hereinafter &quot;Cypherock&quot; or &quot;HODL Tech
              Private Limited&quot; or &quot;we&quot; ) regards as of paramount
              importance the protection and security of information about you.
              The purpose of this Privacy Policy is to inform you about how we
              use your Data, the security measures we implement to ensure their
              integrity and the rights you have to control the use of your Data.
            </Typography>
            <Typography color="textPrimary" gutterBottom>
              The Privacy Policy is applicable in the existing relationship
              between you, User of our Website and Cypherock, owner and
              publisher of the Website. This Privacy Policy applies to the use
              of any Data we collect or that you provide to us in connection
              with your use of our Website. We encourage you to read it
              carefully.
            </Typography>
            <br />
            <br />
            <Typography variant="h5" color="textPrimary" gutterBottom>
              DEFINITIONS AND INTERPRETATION
            </Typography>
            <Typography color="textPrimary" gutterBottom>
              1. In this privacy policy, the following definitions are used:
            </Typography>
            <br />
            <Typography variant="h5" color="textPrimary" gutterBottom>
              DATA
            </Typography>
            <Typography color="textPrimary" gutterBottom>
              Collectively, all information that you submit to Cypherock via our
              Website.
            </Typography>
            <br />
            <Typography variant="h5" color="textPrimary" gutterBottom>
              PERSONAL DATA
            </Typography>
            <Typography color="textPrimary" gutterBottom>
              Collectively, all information making you directly or indirectly
              identifiable (e.g. your name, first name, address, phone number or
              email address but also the IP address of your computer, for
              example, or the information relating to your browsing of our
              Website).
            </Typography>
            <br />
            <Typography variant="h5" color="textPrimary" gutterBottom>
              COOKIES
            </Typography>
            <Typography color="textPrimary" gutterBottom>
              A small text file placed on your computer by our Website when you
              visit certain parts of the Website and/or when you use certain
              features of the Website.
            </Typography>
            <br />
            <Typography variant="h5" color="textPrimary" gutterBottom>
              PERSONAL DATA CONTROLLER
            </Typography>
            <Typography color="textPrimary" gutterBottom>
              The processing of any personal data provided or collected on the
              Website is carried out under the supervision of Cypherock (HODL
              Tech Private Limited) whose head office is located at 68 Circular
              Road, #02-01, 049422, Singapore
            </Typography>
            <br />
            <Typography variant="h5" color="textPrimary" gutterBottom>
              GDPR
            </Typography>
            <Typography color="textPrimary" gutterBottom>
              &quot;General Data Protection Regulation&quot; (EU Regulation
              2016/679), as well as any national legislation adopted in
              accordance therewith.
            </Typography>
            <br />
            <Typography variant="h5" color="textPrimary" gutterBottom>
              USER OR YOU
            </Typography>
            <Typography color="textPrimary" gutterBottom>
              Any Internet user who accesses the Website and who is neither (i)
              employed by Cypherock and acting in the course of his/her
              employment; nor (ii) engaged as a consultant or otherwise
              providing services to Cypherock and accessing the Website in
              connection with the provision of such services;
            </Typography>
            <br />
            <br />
            <Typography variant="h5" color="textPrimary" gutterBottom>
              WEBSITE
            </Typography>
            <Typography color="textPrimary" gutterBottom>
              The following websites: www.cypherock.com, www.shop.cypherock.com,
              www.preorder.cypherock.com, www.cypherock.io and all subdomains of
              these Websites, unless they are expressly excluded from the scope
              of this Policy by their own terms and conditions.
            </Typography>
            <br />
            <Typography color="textPrimary" gutterBottom>
              2. In this Privacy Policy, unless the context requires a different
              interpretation:
            </Typography>
            <Typography color="textPrimary" style={{ paddingLeft: '1rem' }}>
              a. The singular includes the plural and vice versa;
            </Typography>
            <Typography color="textPrimary" style={{ paddingLeft: '1rem' }}>
              b. References to sections, clauses, appendices refer to the
              sections, clauses, appendices of this Privacy Policy;
            </Typography>
            <Typography color="textPrimary" style={{ paddingLeft: '1rem' }}>
              c. A reference to a person includes firms, companies, government
              entities, trusts, and partnerships;
            </Typography>
            <Typography color="textPrimary" style={{ paddingLeft: '1rem' }}>
              d. &quot;Including&quot; means &quot;including but not limited
              to&quot;;
            </Typography>
            <Typography color="textPrimary" style={{ paddingLeft: '1rem' }}>
              e. A reference to any legislative provision includes all
              amendments thereto;
            </Typography>
            <Typography color="textPrimary" style={{ paddingLeft: '1rem' }}>
              f. Headings and subheadings are not part of this Privacy Policy.
            </Typography>
            <br />
            <br />
            <Typography variant="h5" color="textPrimary">
              SCOPE OF THIS PRIVACY POLICY
            </Typography>
            <Typography color="textPrimary">
              3. This Privacy Policy applies only to the actions of Cypherock
              and of Users with respect to our Website. It does not extend to
              websites that can be accessed from our Website, including, but not
              limited to, any links we may provide to social media websites.
            </Typography>
            <br />
            <br />
            <Typography variant="h5" color="textPrimary" gutterBottom>
              USE OF PERSONAL DATA
            </Typography>
            <Typography color="textPrimary" gutterBottom>
              4. When you purchase products or services from our Website, we
              collect and process the Data that is necessary for the follow-up
              of our contractual relationship.
            </Typography>
            <Typography color="textPrimary" gutterBottom>
              For this purpose, we use the information you provide us with:
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
              {` To handle orders,`}
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
              {` To deliver our products and/or provide our services,`}
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
              {` To process invoices, payments and transactions history,`}
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
              {` To manage unpaid bills, returns and claims.`}
            </Typography>
            <br />
            <Typography color="textPrimary" gutterBottom>
              5. Whether you are our customer or simply an Internet user viewing
              the pages of our Website, we may also process your Data to meet
              our legitimate interests, consisting of:
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
              {` Communicating with you about our products and services and send
              you our promotional offers;`}
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
              {` Developing our products and services further;`}
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
              {` Continuously improving our Websites and offering you a more
              enjoyable and efficient shopping experience.`}
            </Typography>
            <br />
            <Typography color="textPrimary" gutterBottom>
              6. The use of the data we collect is, if so, subject to your
              consent to receive our marketing offers and/or those of our
              partners electronically (by email or SMS).
            </Typography>
            <br />
            <Typography color="textPrimary" gutterBottom>
              Depending on the purposes stated above, we may collect the
              following types of information:
            </Typography>
            <Typography color="textPrimary" gutterBottom>
              {` - `}
              <strong>Information that you provide us with:</strong>
              {` When you
              purchase a product or service from Cypherock, we collect, as part
              of the buying and selling process, the personal information you
              submit during your purchase, including:`}
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
              {` Your surname and first name;`}
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
              {` Your contact information such as your address, email and telephone
              numbers;`}
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
              {` Your financial information such as your credit/debit card number.`}
            </Typography>
            <br />
            <Typography color="textPrimary" gutterBottom>
              {' - '}
              <strong>
                Information resulting from your activity on our Website:
              </strong>
              {` We receive and store certain types of information every time you
              interact with us. For example, like many websites, we use Cookies
              and we obtain certain types of information when your Web browser
              accesses our Websites and other content provided by or on behalf
              of Cypherock on other websites. We may therefore also collect the
              following Data from you:`}
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
              {` IP address (automatically collected);`}
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
              {` Web browser type and version (automatically collected);`}
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
              {` Operating system (automatically collected);`}
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
              {` Your browsing history to and from the Website;`}
            </Typography>
            <br />
            <Typography color="textPrimary" gutterBottom>
              In each case, in accordance with this Privacy Policy.
            </Typography>
            <br />
            <Typography color="textPrimary" variant="h5" gutterBottom>
              RETENTION OF PERSONAL DATA
            </Typography>
            <Typography color="textPrimary">
              7. The retention period of Personal Data processed by Cypherock
              may vary depending on common practice, the documents considered in
              accordance with the legal obligations and the applicable
              limitation rules.
              <br />
              <br />
              With regard to credit card data, Cypherock uses payment services
              providers that manage transaction data in accordance with strict
              security rules applicable to online payments via encryption
              methods.
            </Typography>
            <br />
            <Typography color="textPrimary">
              8. All Personal Data is securely stored on our servers in
              accordance with industry standards and the GDPR. For more details
              on the security measures implemented, please refer to the section
              “Security” below.
            </Typography>
            <br />
            <br />
            <Typography color="textPrimary" variant="h5" gutterBottom>
              RECIPIENTS OF PERSONAL DATA
            </Typography>
            <Typography color="textPrimary">
              9. We transmit your Data to our employees who are authorized to
              process them as part of their duties.
              <br />
              <br />
              We may also transmit some of your data to our technical and
              logistic service providers acting on our behalf, and we ensure
              that they provide for the necessary guarantees with respect to the
              GDPR.
            </Typography>
            <br />
            <Typography color="textPrimary">
              10. To allow access to certain payment methods, we use third party
              providers that may also collect Personal Data. In this case, such
              service providers are responsible for the collection and
              processing of Data for the provision of the service. Please refer,
              if necessary, to their own privacy policy.
            </Typography>
            <br />
            <Typography color="textPrimary">
              11. All Personal Data used by these third parties is used solely
              for the purposes of the services provided at our request. Any use
              for other purposes is strictly prohibited. In addition, any
              Personal Data processed by third parties will be in accordance
              with the terms of this Privacy Policy and in compliance with the
              GDPR. The third party providers we use will only collect, use and
              disclose your information to the extent necessary to enable them
              to perform the services they provide to us.
            </Typography>
            <br />
            <Typography color="textPrimary">
              12. In certain circumstances and where required by law, we may
              transmit your data to competent administrative or judicial
              authorities or any other authorized third party.
            </Typography>
            <br />
            <br />
            <Typography color="textPrimary" variant="h5" gutterBottom>
              LINKS TO OTHER WEBSITES
            </Typography>
            <Typography color="textPrimary">
              13. Our Website may, from time to time, provide links to other
              websites. We have no control over such websites and we are not
              responsible for their content. This Privacy Policy does not extend
              to the use of such websites. We advise you to read the privacy
              policy or charter applicable to such other websites before using
              them.
            </Typography>
            <br />
            <br />
            <Typography color="textPrimary" variant="h5" gutterBottom>
              YOUR RIGHTS REGARDING THE USE OF YOUR PERSONAL DATA
            </Typography>
            <Typography color="textPrimary">
              14. When you provide us with your Personal Data, you stay in
              control of such Personal Data and have the option to limit their
              use. This limitation may concern:
              <br />
              The use of Personal Data for direct marketing purposes, which are
              subject to the opt-in rule; and The sharing of Personal Data with
              third parties.
            </Typography>
            <br />
            <Typography color="textPrimary">
              15. You have the right to request access to your Personal Data,
              their rectification or erasure, as well as the right to request
              the restriction of the processing or to object to the processing.
              <br />
              You also have the right to withdraw your consent at any time, in
              particular to have your data no longer processed for the purpose
              of marketing by electronic means.
              <br />
              You also have the right to request a copy, in an interoperable
              format, of the Personal Data that you have provided to us.
              <br />
              You can address your requests to: support@cypherock.com.
              <br />
              Your requests must be accompanied by a copy of a proof of identity
              and will be reviewed by our services as soon as possible.
              <br />
              For more information on how to access your Personal Data and to
              exercise your rights, please contact us (see contact information
              at the end of this Privacy Policy).
            </Typography>
            <br />
            <br />
            <Typography color="textPrimary" variant="h5" gutterBottom>
              FUNCTIONALITY OF THE WEBSITE
            </Typography>
            <Typography color="textPrimary">
              16. In order to use all the resources and features available on
              our Website, you may be required to transmit certain Personal Data
              to us.
            </Typography>
            <br />
            <Typography color="textPrimary">
              17. You may restrict the use of Cookies in your Web browser.
            </Typography>
            <br />
            <br />
            <Typography color="textPrimary" variant="h5" gutterBottom>
              PERSONAL DATA SECURITY
            </Typography>
            <Typography color="textPrimary">
              18. Personal Data security is of great importance to Cypherock. In
              order to protect your Personal Data, we have implemented
              appropriate physical, electronic and organizational procedures to
              safeguard and secure the Personal Data collected via our Website
              in order to ensure its integrity and confidentiality.
            </Typography>
            <br />
            <Typography color="textPrimary">
              19. If a password is required to access certain sections of our
              Website, you are responsible for keeping this password
              confidential.
            </Typography>
            <br />
            <Typography color="textPrimary">
              20. We endeavor to do all we can to protect your Personal Data.
              However, the transmission of information on the Internet is not
              fully secure and remains under your sole responsibility. We cannot
              ensure the security of the transmission of your Data to our
              Website.
            </Typography>
            <br />
            <Typography color="textPrimary">
              21. Payment Security: If you provide us with credit card
              information, such information is encrypted using a secure Internet
              Trade Protocol (TLS) and sent directly to our banking service
              provider. This information is never stored on our server.
            </Typography>
            <br />
            <br />
            <Typography color="textPrimary" variant="h5" gutterBottom>
              MISCELLANEOUS
            </Typography>
            <Typography color="textPrimary">
              22. If a court or competent authority considers that any provision
              of this Privacy Policy (or any part thereof) is invalid, illegal
              or unenforceable, that provision or relevant part of the provision
              will, to the extent required, be deemed to be deleted. The
              validity and enforceability of the other provisions of this
              Privacy Policy will not be affected.
            </Typography>
            <br />
            <Typography color="textPrimary">
              23. Unless otherwise agreed, no delay, act or omission by a party
              in exercising a right or remedy will be deemed a waiver of such
              right, or of another right or remedy.
            </Typography>
            <br />
            <Typography color="textPrimary">
              24. This Privacy Policy will be governed by and interpreted
              according to French law. Any dispute arising out of this Privacy
              Policy will be subject to the exclusive jurisdiction of the French
              courts.
            </Typography>
            <br />
            <br />
            <Typography color="textPrimary" variant="h5" gutterBottom>
              OUR COMMITMENT TO YOUR PRIVACY
            </Typography>
            <Typography color="textPrimary">
              25. We can assure you that we comply with the GDPR and that we
              process your Data lawfully, fairly and transparently.
              <br />
              We take confidentiality and privacy issues very seriously. We
              therefore ensure that your personal information is secure; we
              communicate our privacy and security guidelines and practices to
              all our employees and service providers and strictly enforce
              privacy safeguards within our company
            </Typography>
            <br />
            <br />
            <Typography color="textPrimary" variant="h5" gutterBottom>
              CHANGES TO THIS PRIVACY POLICY
            </Typography>
            <Typography color="textPrimary">
              26. We reserve the right to make changes to this Privacy Policy as
              we deem necessary from time to time or as may be required by law.
              All changes will be posted immediately on our Website and you are
              deemed to have accepted the new terms of the Privacy Policy when
              you first use the Website after such changes.
            </Typography>
            <br />
            <Typography color="textPrimary">
              27. If our company is the subject of a corporate transaction such
              as an acquisition or merger with another company, your information
              may be transferred to the new owners so that we can continue to
              sell our products to you.
            </Typography>
            <br />
            <Typography color="textPrimary">
              28. In the above cases, we will take steps to protect your
              privacy.
            </Typography>
            <br />
            <Typography color="textPrimary">
              <span>HODL Tech Private Limited</span>
              <br />
              <span>#02-01, 049422,</span>
              <br />
              <span>68 Circular Road,</span>
              <br />
              <span>Singapore</span>
            </Typography>
            <br />
            <br />
          </Grid>
          <Grid item xs={1} />
        </Grid>
      }
    />
  );
};

Privacy.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
};

export default Privacy;
