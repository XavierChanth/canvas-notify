import Head from 'next/head'
import { Card, Switch } from 'antd'
import { useState } from 'react'
require('dotenv').config();
require('isomorphic-fetch');
import 'antd/dist/antd.min.css';

const CourseRow = ({ data }) => {
  const { course, item } = data
  return <Card title={`${item.name} - ${course.name.split(' - ')[1]}`} >
    <p>Due: {`${item.dueAt.toLocaleDateString()} ${item.dueAt.toLocaleTimeString()}`}</p>
    <div dangerouslySetInnerHTML={{ __html: item.description }}></div>
  </Card>
}

const query = `
query myQuery{
  allCourses {
    name
    term {
      endAt
    }
    assignmentsConnection {
      nodes {
        name
        description
        dueAt
        state
      }
    }
  }
}
`;

export const getStaticProps = async (context) => {
  const res = await fetch('https://learn.ontariotechu.ca/api/graphql', {
    body: JSON.stringify({ query: query }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.API_TOKEN}`,
      Accept: 'application/json+canvas-string-ids, application/json, text/plain, */*'
    }
  });

  let [month, day, year] = new Date().toLocaleDateString("en-US").split("/");
  const data = (await res.json()).data.allCourses.filter(item => {
    return new Date(year, month, day) < new Date(item.term.endAt);
  })

  if (!data) {
    return {
      props: {
        state: []
      }
    }
  }

  return {
    props: {
      state: data
    }
  }
};

export default function Home({ state }) {
  let [pastToggle, setPastToggle] = useState(false);
  let [constantToggle, setConstantToggle] = useState(false);
  let store = []
  let past = []
  let constant = []
  state.forEach((course, index) => {
    course.assignmentsConnection.nodes.forEach((item, key) => {
      let data = { course: course, item: { ...item, dueAt: new Date(item.dueAt) } };
      let [month, day, year] = data.item.dueAt.toLocaleDateString("en-US").split("/")
      if (year === '1969') {
        constant.push(data)
      } else if (data.item.dueAt - new Date() > 0){
        store.push(data)
        console.log("gfds")
      } else {
        past.push(data)
        console.log("asdf")
      }
    });
  });
  let data = store.sort((a, b) => a.item.dueAt - b.item.dueAt).map((item, index) => <CourseRow data={item} key={index} />);
  let pastData = past.sort((a, b) => a.item.dueAt - b.item.dueAt).map((item, index) => <CourseRow data={item} key={index} />);
  let constantData = constant.sort((a, b) => a.item.dueAt - b.item.dueAt).map((item, index) => <CourseRow data={item} key={index} />);
  return (
    <div className="container">
      <Head>
        <title>Canvas Notify</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h2 className="title">
          Canvas Notify
        </h2>

        <div className="space">
          <h3 style={{ display: "inline-block", marginRight: "2em" }}>Show items without due-dates:</h3>
          <Switch onChange={checked => setConstantToggle(checked)}/>
        </div>
        <div hidden={!constantToggle} style={{ width: '100%' }}>
          <h1>Constant Assignments</h1>
          <Card.Grid style={{ width: '100%'}}>
            {constantData}
          </Card.Grid>
        </div>
        <div className="space">
          <h3 style={{ display: "inline-block", marginRight: "2em" }}>Show items with past due-dates:</h3>
          <Switch onChange={checked => setPastToggle(checked)} />
        </div>
        <div hidden={!pastToggle} style={{ width: '100%' }}>
          <h1>Past Assignments</h1>
          <Card.Grid style={{ width: '100%' }}>
            {pastData}
          </Card.Grid>
        </div>

        <div style={{ width: '100%' }}>
          <h1>Current Assignments</h1>
          <Card.Grid style={{ width: '100%' }}>
            {data}
          </Card.Grid>
        </div>

      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .space {
          margin: 1rem auto;
        }

        h1 {
          font-size: 2rem;
        }

        .title a {
          color: #0070f3;
          text-decoration: none;
        }

        .title a:hover,
        .title a:focus,
        .title a:active {
          text-decoration: underline;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
          text-align: center;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}
