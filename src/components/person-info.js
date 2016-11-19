import _ from 'lodash';
import React, { Component } from 'react';
import FlatButton from 'material-ui/FlatButton';
import CircularProgress from 'material-ui/CircularProgress';
import { Card, CardActions, CardHeader, CardMedia, CardTitle, CardText } from 'material-ui/Card';
import Divider from 'material-ui/Divider';
import zurich from '../utils/zurich';


export default class PersonInfo extends Component {

  constructor (props, context) {
    super(props, context);

    this.props.chat.insuranceID = '10000000024';

    this.loadCustomer();

    this.state = {
      customer: null
    };
  }


  loadCustomer () {
    if (this.props.chat.insuranceID) {
      zurich.getCustomer(this.props.chat.insuranceID).done((data) => {
        this.setState({ customer: data.value[0] });
      });
    }
  }

  componentDidUpdate (prevProps) {
    if (prevProps.chat.insuranceID !== this.props.chat.insuranceID) {
      this.loadCustomer();
    }
  }

  render () {
    const { onClose, chat } = this.props;
    const { customer } = this.state;

    let content;

    if (chat.insuranceID) {
      content = <InsuranceDetails chat={chat} customer={customer}/>
    } else {
      content = (
        <Card>
          <CardHeader
            title={`${chat.name}`}
            avatar={chat.img}
          />
          <CardText>This person has no associated account number.</CardText>
        </Card>
      );
    }

    return (
      <div className='PersonInfo'>

        <div className='SubHeader'>
          <h1>Customer Details</h1>
          <FlatButton
            style={{ color: '#fff' }}
            label="close"
            onClick={() => onClose()}/>
        </div>

        <div className='PersonInfo__content'>
          {content}
        </div>
      </div>
    );
  }
}

function InsuranceDetails ({ chat, customer }) {
  let details, policies;
  let name = chat.name;


  if (!customer) {
    details = <div className='centered'><CircularProgress /></div>;
  } else {
    let { FirstName, LastName, DateOfBirth } = customer.AccountHolderContact;
    //name = FirstName + ' ' + LastName;

    details = (
      <table className='InfoTable'>
        <tbody>
          <tr>
            <th>account number</th>
            <td>{customer.AccountNumber}</td>
          </tr>
          <tr>
            <th>date of birth</th>
            <td>{formatDate(DateOfBirth)}</td>
          </tr>
        </tbody>
      </table>
    );

    policies = <PolicyDetails policies={customer.Policies}/>
  }

  return (
    <div>
      <Card>
        <CardHeader
          title={name}
          avatar={chat.img}
        />
        <CardText>
          {details}
        </CardText>
      </Card>


      {policies}
    </div>
  )
}

function PolicyDetails ({ policies }) {
  let policiesHTML = _.map(policies, (policy, i) => {

    return (
      <Card key={i}>
        <CardHeader
          title={`${formatProductCode(policy.ProductCode)} ${formatStatus(policy.LatestPeriod.Status)}`}
          subtitle={`${formatDate(policy.LatestPeriod.PolicyStartDate)} - ${formatDate(policy.LatestPeriod.TermEndDate_ZDE)}`}
          showExpandableButton={true}
        />
        <Divider/>
        <CardText expandable={true}>
          <PolicyLines latestPeriod={policy.LatestPeriod}/>
        </CardText>
      </Card>
    );
  });

  return (
    <div>
      {policiesHTML}
    </div>
  );
}

function formatProductCode (code) {
  return ({
      'NPLPL_NewPersonalProduct': 'Private Insurance'
    }[code]) || code;
}

function formatDate (string) {
  if (!string) {
    return '';
  }

  const [year, month, day] = string.split('-');
  return `${day}.${month}.${year}`;
}


function formatStatus (status) {
  return ({
      tc_Draft: '(draft)',
      tc_Expired: '(expired)',
    }[status]) || '';
}

function formatPolicyLine (policyLine) {
  return ({
      UNLine: '',
      GEBLine: '',
      RSLine: '',
      MSLine: '',
      HALine: '',
      HRLine: ''
    }[policyLine]) || policyLine.substring(0, policyLine.length - 6);
}

function PolicyLines ({ latestPeriod }) {
  const lineIds = _(latestPeriod)
    .keys()
    .filter((key) => _.endsWith(key, 'LineExists'))
    .value();

  const lines = _.pick(latestPeriod, lineIds);


  const linesHTML = _.map(lines, (included, id) => {
    return <li key={id}
               className={included ? 'PolicyLineList__item--included' : 'PolicyLineList__item--excluded'}>{formatPolicyLine(id)}</li>;
  });

  return (
    <ul className='PolicyLineList'>
      {linesHTML}
    </ul>
  )
}